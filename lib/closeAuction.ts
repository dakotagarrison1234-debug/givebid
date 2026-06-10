import { prisma } from "@/lib/prisma";

type ItemWithBidsAndOrg = {
  id: string;
  title: string;
  auctionId: string | null;
  bids: { id: string; clerkUserId: string; amount: number }[];
  auction: { id: string; title: string; organization: { name: string; slug: string } } | null;
};

type WinnerEntry = {
  clerkUserId: string;
  auctionName: string;
  orgName: string;
  items: { title: string; amount: number }[];
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
    return { clerkUserId: winningBid.clerkUserId, amount: winningBid.amount };
  } else {
    await prisma.$transaction([
      prisma.item.update({ where: { id: item.id }, data: { status: "UNSOLD" } }),
      prisma.proxyBid.updateMany({ where: { itemId: item.id, isActive: true }, data: { isActive: false } }),
    ]);
    return null;
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
 * Notifications fire ONLY when an auction fully closes (all items settled) —
 * not when individual items close. This means bidders get exactly one email
 * per auction regardless of popcorn extensions, and never before the last
 * item in their auction has finished.
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
      include: { organization: true },
    });
    if (!auction || (auction.status !== "OPEN" && auction.status !== "CLOSING")) continue;

    await prisma.auction.update({ where: { id: auctionId }, data: { status: "CLOSED" } });
    closedAuctions++;

    // All items settled — build winner map from WON bids and send one email per bidder
    const wonBids = await prisma.bid.findMany({
      where: { item: { auctionId }, status: "WON" },
      include: { item: { select: { title: true } } },
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
      winnerMap.get(bid.clerkUserId)!.items.push({ title: bid.item.title, amount: bid.amount });
    }
    await notifyWinners(winnerMap);
  }

  return { closedItems: expiredItems.length, closedAuctions };
}

/**
 * Manually close a specific auction (used by the admin "Close Auction" button).
 * Sends ONE "you won" email per bidder covering all their wins.
 */
export async function closeAuction(auctionId: string): Promise<{ winnersCount: number }> {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: {
      organization: true,
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
      winnerMap.get(key)!.items.push({ title: item.title, amount: result.amount });
    }
  }

  await notifyWinners(winnerMap);
  await prisma.auction.update({ where: { id: auctionId }, data: { status: "CLOSED" } });

  return { winnersCount: winnerMap.size };
}
