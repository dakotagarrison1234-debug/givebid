import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type ItemWithBidsAndOrg = {
  id: string;
  title: string;
  auctionId: string | null;
  bids: { id: string; clerkUserId: string; amount: Prisma.Decimal }[];
  auction: { id: string; title: string; organization: { name: string; slug: string } } | null;
};

type WinnerEntry = {
  clerkUserId: string;
  auctionName: string;
  orgName: string;
  items: { id: string; title: string; amount: number }[];
};

type OrgForCharging = {
  id: string;
  stripeAccountId: string | null;
  platformFeePercent: Prisma.Decimal;
  taxPercent: Prisma.Decimal;
};

/**
 * Closes a single item: marks winning bid WON + item SOLD (or UNSOLD), deactivates proxies.
 * Does NOT fire GHL notifications — callers collect winners and send one email per bidder.
 * Returns the winning bid info if there was one, null if unsold.
 */
async function closeItem(
  item: ItemWithBidsAndOrg
): Promise<{ clerkUserId: string; amount: number } | null> {
  const winningBid = item.bids[0];

  if (winningBid) {
    await prisma.$transaction([
      prisma.bid.update({ where: { id: winningBid.id }, data: { status: "WON" } }),
      prisma.item.update({ where: { id: item.id }, data: { status: "SOLD" } }),
      prisma.proxyBid.updateMany({ where: { itemId: item.id, isActive: true }, data: { isActive: false } }),
    ]);
    return { clerkUserId: winningBid.clerkUserId, amount: Number(winningBid.amount) };
  } else {
    await prisma.$transaction([
      prisma.item.update({ where: { id: item.id }, data: { status: "UNSOLD" } }),
      prisma.proxyBid.updateMany({ where: { itemId: item.id, isActive: true }, data: { isActive: false } }),
    ]);
    return null;
  }
}

/**
 * Auto-charges every winner in a closed auction exactly once.
 *
 * One PaymentIntent per winner per auction — covers all their won items.
 * Uses off_session: true so no 3DS prompt is required (the card was saved
 * with usage: "off_session" during setup).
 *
 * application_fee_amount = platform fee on bid amount (not including tax).
 * Tax = org.taxPercent of bid amount, added on top of the bid total.
 *
 * On success:  creates Payment records (status=PAID) + sets items to PENDING_PICKUP.
 * On failure:  creates Payment records (status=FAILED) + logs the reason.
 *              Winners will see a retry option on their dashboard.
 */
async function chargeWinners(
  winnerMap: Map<string, WinnerEntry>,
  org: OrgForCharging,
  auctionId: string
): Promise<void> {
  if (!org.stripeAccountId || winnerMap.size === 0) return;

  const platformFeePercent = Number(org.platformFeePercent);
  const taxPercent = Number(org.taxPercent);

  for (const [clerkUserId, winner] of winnerMap) {
    const itemIds = winner.items.map((i) => i.id);

    // Look up the bidder's saved card on this connected account
    const bidderCustomer = await prisma.bidderStripeCustomer.findUnique({
      where: {
        clerkUserId_organizationId: {
          clerkUserId,
          organizationId: org.id,
        },
      },
    });

    // Idempotency guard — skip if any Payment already exists for these items
    const existingPayment = await prisma.payment.findFirst({
      where: { itemId: { in: itemIds } },
    });
    if (existingPayment) {
      console.log(`Auto-charge: payment already exists for items ${itemIds.join(",")} — skipping`);
      continue;
    }

    if (!bidderCustomer?.defaultPaymentMethodId) {
      // No card on file — mark all items as FAILED so bidder sees them on dashboard
      console.warn(`Auto-charge: no card on file for ${clerkUserId} in org ${org.id}`);
      const now = new Date();
      for (const item of winner.items) {
        await prisma.payment.create({
          data: {
            clerkUserId,
            itemId: item.id,
            amount: item.amount,
            status: "FAILED",
            autoChargeAttemptedAt: now,
            failureReason: "No payment card on file",
          },
        });
      }
      continue;
    }

    // Calculate totals (all in cents for Stripe)
    const totalBidAmount = winner.items.reduce((s, i) => s + i.amount, 0);
    const taxAmountCents = Math.round(totalBidAmount * taxPercent / 100 * 100);
    const chargeAmountCents = Math.round(totalBidAmount * 100) + taxAmountCents;
    const appFeeAmountCents = Math.round(totalBidAmount * platformFeePercent / 100 * 100);

    const now = new Date();

    try {
      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount: chargeAmountCents,
          currency: "usd",
          customer: bidderCustomer.stripeCustomerId,
          payment_method: bidderCustomer.defaultPaymentMethodId,
          off_session: true,
          confirm: true,
          application_fee_amount: appFeeAmountCents,
          metadata: {
            clerkUserId,
            orgId: org.id,
            auctionId,
            itemIds: itemIds.slice(0, 5).join(","), // Stripe metadata 500-char limit
          },
        },
        {
          stripeAccount: org.stripeAccountId,
          // Stable per winner per auction — a winner is only ever charged once.
          idempotencyKey: `autocharge-${auctionId}-${clerkUserId}`,
        }
      );

      // Charge succeeded — create PAID Payment records + move items to PENDING_PICKUP.
      // Distribute fee/tax across items in whole cents; any leftover cent goes to item 0
      // so the per-item rows sum back to the actual charged total.
      const n = winner.items.length;
      const baseFeeCents = Math.floor(appFeeAmountCents / n);
      const feeRemainderCents = appFeeAmountCents - baseFeeCents * n;
      const baseTaxCents = Math.floor(taxAmountCents / n);
      const taxRemainderCents = taxAmountCents - baseTaxCents * n;

      for (let idx = 0; idx < winner.items.length; idx++) {
        const item = winner.items[idx];
        const itemFeeCents = baseFeeCents + (idx === 0 ? feeRemainderCents : 0);
        const itemTaxCents = baseTaxCents + (idx === 0 ? taxRemainderCents : 0);
        try {
          await prisma.payment.create({
            data: {
              clerkUserId,
              itemId: item.id,
              amount: item.amount,
              applicationFeeAmount: itemFeeCents / 100,
              taxAmount: itemTaxCents / 100,
              stripePaymentIntentId: paymentIntent.id,
              status: "PAID",
              autoChargeAttemptedAt: now,
            },
          });
        } catch (e) {
          if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
          // P2002 = a payment row for this item+user already exists; safe to ignore.
        }
        await prisma.item.update({
          where: { id: item.id },
          data: { status: "PENDING_PICKUP" },
        });
      }

      console.log(
        `Auto-charge: $${(chargeAmountCents / 100).toFixed(2)} charged to ${clerkUserId} ` +
          `(PI: ${paymentIntent.id})`
      );
    } catch (err: unknown) {
      // Charge failed — mark all items FAILED so bidder sees them on dashboard
      let failureReason = "Charge failed";
      if (
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof (err as { message: unknown }).message === "string"
      ) {
        failureReason = (err as { message: string }).message;
      }
      console.error(`Auto-charge FAILED for ${clerkUserId}:`, failureReason);

      for (const item of winner.items) {
        try {
          await prisma.payment.create({
            data: {
              clerkUserId,
              itemId: item.id,
              amount: item.amount,
              status: "FAILED",
              autoChargeAttemptedAt: now,
              failureReason,
            },
          });
        } catch (p2002err) {
          if (!(p2002err instanceof Prisma.PrismaClientKnownRequestError && p2002err.code === "P2002")) throw p2002err;
          // P2002 = payment row already exists; safe to ignore.
        }
      }
    }
  }
}

/**
 * Fires one GHL "auction won" webhook per unique bidder.
 * Summarises all the items they won in that auction — no per-item spam.
 */
async function notifyWinners(winnerMap: Map<string, WinnerEntry>): Promise<void> {
  if (!process.env.GHL_AUCTION_WON_WEBHOOK || winnerMap.size === 0) return;

  const bidderIds = [...winnerMap.keys()];
  const profiles = await prisma.bidderProfile.findMany({
    where: { clerkUserId: { in: bidderIds } },
    select: { clerkUserId: true, email: true, phone: true, name: true },
  });
  const profileMap = new Map(profiles.map((p) => [p.clerkUserId, p]));

  for (const [clerkUserId, winner] of winnerMap) {
    const profile = profileMap.get(clerkUserId);
    const email = profile?.email ?? "";
    const phone = profile?.phone ?? "";
    const name = profile?.name ?? "Winner";
    const totalAmount = winner.items.reduce((s, i) => s + i.amount, 0);
    const itemCount = winner.items.length;
    const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;

    fetch(process.env.GHL_AUCTION_WON_WEBHOOK!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // GHL contact lookup fields
        email,
        phone,
        name,
        firstName: name.split(" ")[0] || name,
        lastName: name.split(" ").slice(1).join(" ") || "",
        // Notification payload
        event: "auction_won",
        bidderEmail: email,
        bidderPhone: phone,
        bidderName: name,
        itemCount,
        totalAmount,
        auctionName: winner.auctionName,
        orgName: winner.orgName,
        paymentUrl,
      }),
    }).catch((err) => console.error("GHL won webhook failed:", err));
  }
}

/**
 * Find DRAFT auctions whose startAt has passed and open them,
 * activating all their DRAFT items in the same pass.
 */
export async function openScheduledAuctions(): Promise<{ openedAuctions: number }> {
  const now = new Date();

  const dueAuctions = await prisma.auction.findMany({
    where: { status: "DRAFT", startAt: { lte: now } },
    include: { organization: true },
  });

  for (const auction of dueAuctions) {
    await prisma.$transaction([
      prisma.auction.update({ where: { id: auction.id }, data: { status: "OPEN" } }),
      prisma.item.updateMany({ where: { auctionId: auction.id, status: "DRAFT" }, data: { status: "ACTIVE" } }),
    ]);

    if (process.env.GHL_AUCTION_STARTED_WEBHOOK) {
      const auctionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${auction.organization.slug}/${auction.slug}`;
      fetch(process.env.GHL_AUCTION_STARTED_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "auction_started",
          auctionName: auction.title,
          auctionUrl,
          orgName: auction.organization.name,
        }),
      }).catch((e) => console.error("GHL auction-started (cron) webhook failed:", e));
    }
  }

  // Also activate any DRAFT items that are already inside an OPEN auction
  await prisma.item.updateMany({
    where: { status: "DRAFT", auction: { status: "OPEN" } },
    data: { status: "ACTIVE" },
  });

  return { openedAuctions: dueAuctions.length };
}

/**
 * Find and close all ACTIVE items whose effective end time has passed,
 * then close any OPEN auctions that have no remaining ACTIVE items.
 *
 * Auto-charges all winners when each auction fully closes.
 * GHL notifications fire AFTER charges are attempted.
 *
 * Called by the cron job every minute.
 */
export async function closeExpiredItems(): Promise<{ closedItems: number; closedAuctions: number }> {
  const now = new Date();

  const itemsWithOwnExpiry = await prisma.item.findMany({
    where: {
      status: "ACTIVE",
      itemEndAt: { lte: now },
      auction: { status: { in: ["OPEN", "CLOSING"] } },
    },
    include: {
      bids: { where: { status: "ACTIVE" }, orderBy: { amount: "desc" }, take: 1 },
      auction: { include: { organization: true } },
    },
  });

  const itemsWithAuctionExpiry = await prisma.item.findMany({
    where: {
      status: "ACTIVE",
      itemEndAt: null,
      auction: { status: { in: ["OPEN", "CLOSING"] }, endAt: { lte: now } },
    },
    include: {
      bids: { where: { status: "ACTIVE" }, orderBy: { amount: "desc" }, take: 1 },
      auction: { include: { organization: true } },
    },
  });

  const expiredItems = [...itemsWithOwnExpiry, ...itemsWithAuctionExpiry];

  for (const item of expiredItems) {
    await closeItem(item as ItemWithBidsAndOrg);
  }

  // Close auctions with no remaining ACTIVE items
  const affectedAuctionIds = [
    ...new Set(expiredItems.map((i) => i.auctionId).filter(Boolean)),
  ] as string[];

  // Close auctions that now have no ACTIVE items — and notify winners at this point
  const auctionsToCheck = [
    ...new Set([
      ...affectedAuctionIds,
      // Also pick up auctions past endAt with no active items (edge case)
      ...(await prisma.auction.findMany({
        where: { status: { in: ["OPEN", "CLOSING"] }, endAt: { lte: now }, items: { none: { status: "ACTIVE" } } },
        select: { id: true },
      })).map((a) => a.id),
    ]),
  ];

  let closedAuctions = 0;
  for (const auctionId of auctionsToCheck) {
    const remaining = await prisma.item.count({ where: { auctionId, status: "ACTIVE" } });
    if (remaining > 0) continue; // still items running (popcorn extension still live)

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            stripeAccountId: true,
            platformFeePercent: true,
            taxPercent: true,
          },
        },
      },
    });
    if (!auction || (auction.status !== "OPEN" && auction.status !== "CLOSING")) continue;

    await prisma.auction.update({ where: { id: auctionId }, data: { status: "CLOSED" } });
    closedAuctions++;

    // Build winner map from WON bids
    const wonBids = await prisma.bid.findMany({
      where: { item: { auctionId }, status: "WON" },
      include: { item: { select: { id: true, title: true } } },
    });
    const winnerMap = new Map<string, WinnerEntry>();
    for (const bid of wonBids) {
      if (!winnerMap.has(bid.clerkUserId)) {
        winnerMap.set(bid.clerkUserId, {
          clerkUserId: bid.clerkUserId,
          auctionName: auction.title,
          orgName: auction.organization.name,
          items: [],
        });
      }
      winnerMap.get(bid.clerkUserId)!.items.push({
        id: bid.item.id,
        title: bid.item.title,
        amount: Number(bid.amount),
      });
    }

    // Auto-charge winners BEFORE sending GHL notifications
    await chargeWinners(winnerMap, auction.organization, auctionId);
    await notifyWinners(winnerMap);
  }

  return { closedItems: expiredItems.length, closedAuctions };
}

/**
 * Manually close a specific auction (used by the admin "Close Auction" button).
 * Auto-charges all winners and sends ONE "you won" email per bidder.
 */
export async function closeAuction(auctionId: string): Promise<{ winnersCount: number }> {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          stripeAccountId: true,
          platformFeePercent: true,
          taxPercent: true,
        },
      },
      items: {
        where: { status: "ACTIVE" },
        include: {
          bids: { where: { status: "ACTIVE" }, orderBy: { amount: "desc" }, take: 1 },
        },
      },
    },
  });

  if (!auction) throw new Error(`Auction ${auctionId} not found`);

  const winnerMap = new Map<string, WinnerEntry>();

  for (const item of auction.items) {
    const result = await closeItem({
      ...item,
      auction: { id: auction.id, title: auction.title, organization: auction.organization },
    });
    if (result) {
      const key = result.clerkUserId;
      if (!winnerMap.has(key)) {
        winnerMap.set(key, {
          clerkUserId: result.clerkUserId,
          auctionName: auction.title,
          orgName: auction.organization.name,
          items: [],
        });
      }
      winnerMap.get(key)!.items.push({ id: item.id, title: item.title, amount: result.amount });
    }
  }

  // Mark CLOSED first so the cron can't pick it up simultaneously and double-charge
  await prisma.auction.update({ where: { id: auctionId }, data: { status: "CLOSED" } });
  // Auto-charge winners BEFORE sending GHL notifications
  await chargeWinners(winnerMap, auction.organization, auctionId);
  await notifyWinners(winnerMap);

  return { winnersCount: winnerMap.size };
}
