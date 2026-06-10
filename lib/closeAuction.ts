import { prisma } from "@/lib/prisma";

type ItemWithBidsAndOrg = {
  id: string;
  auctionId: string | null;
  title: string;
  bids: { id: string; clerkUserId: string; amount: number }[];
  auction: { id: string; title: string; organization: { name: string } } | null;
};

async function closeItem(item: ItemWithBidsAndOrg) {
  const winningBid = item.bids[0];

  if (winningBid) {
    await prisma.$transaction([
      prisma.bid.update({ where: { id: winningBid.id }, data: { status: "WON" } }),
      prisma.item.update({ where: { id: item.id }, data: { status: "SOLD" } }),
    ]);

    const winnerProfile = await prisma.bidderProfile.findUnique({
      where: { clerkUserId: winningBid.clerkUserId },
    });

    if (process.env.GHL_AUCTION_WON_WEBHOOK && item.auction) {
      const wonEmail = winnerProfile?.email || "";
      const wonPhone = winnerProfile?.phone || "";
      const wonName = winnerProfile?.name || "Winner";
      const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;
      fetch(process.env.GHL_AUCTION_WON_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // GHL contact lookup fields — must be top-level for GHL to find/create contact
          email: wonEmail,
          phone: wonPhone,
          name: wonName,
          firstName: wonName.split(" ")[0] || wonName,
          lastName: wonName.split(" ").slice(1).join(" ") || "",
          // Custom workflow variables
          event: "auction_won",
          bidderEmail: wonEmail,
          bidderPhone: wonPhone,
          bidderName: wonName,
          itemTitle: item.title,
          itemId: item.id,
          winningAmount: winningBid.amount,
          auctionName: item.auction.title,
          orgName: item.auction.organization.name,
          paymentUrl,
        }),
      }).catch((err) => console.error("GHL won webhook failed:", err));
    }
  } else {
    await prisma.item.update({ where: { id: item.id }, data: { status: "UNSOLD" } });
  }
}

/**
 * Find and close all ACTIVE items whose effective end time has passed,
 * then close any OPEN auctions that have no remaining ACTIVE items.
 * Called by the cron job every minute.
 */
/**
 * Find DRAFT auctions whose startAt has passed and open them,
 * activating all their DRAFT items in the same pass.
 */
export async function openScheduledAuctions(): Promise<{ openedAuctions: number }> {
  const now = new Date();

  // Open DRAFT auctions whose startAt has passed
  const dueAuctions = await prisma.auction.findMany({
    where: { status: "DRAFT", startAt: { lte: now } },
    include: { organization: true },
  });

  for (const auction of dueAuctions) {
    await prisma.$transaction([
      prisma.auction.update({ where: { id: auction.id }, data: { status: "OPEN" } }),
      prisma.item.updateMany({ where: { auctionId: auction.id, status: "DRAFT" }, data: { status: "ACTIVE" } }),
    ]);

    // Notify GHL that this auction just went live
    fireAuctionStartedWebhook(auction);
  }

  // Also activate any DRAFT items that are already inside an OPEN auction
  // (handles items added after the auction was opened, or pre-existing DRAFT items)
  await prisma.item.updateMany({
    where: { status: "DRAFT", auction: { status: "OPEN" } },
    data: { status: "ACTIVE" },
  });

  return { openedAuctions: dueAuctions.length };
}

/** Fire GHL auction-started webhook (fire-and-forget). */
export function fireAuctionStartedWebhook(auction: {
  id: string;
  title: string;
  slug: string;
  startAt: Date;
  endAt: Date;
  organization: { name: string; slug: string };
}) {
  if (!process.env.GHL_AUCTION_STARTED_WEBHOOK) return;
  const auctionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${auction.organization.slug}/${auction.slug}`;
  fetch(process.env.GHL_AUCTION_STARTED_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: "auction_started",
      auctionId: auction.id,
      auctionTitle: auction.title,
      auctionUrl,
      orgName: auction.organization.name,
      startAt: auction.startAt.toISOString(),
      endAt: auction.endAt.toISOString(),
    }),
  }).catch((err) => console.error("GHL auction started webhook failed:", err));
}

export async function closeExpiredItems(): Promise<{ closedItems: number; closedAuctions: number }> {
  const now = new Date();

  // Items with their own popcorn-extended endAt that has passed
  const itemsWithOwnExpiry = await prisma.item.findMany({
    where: {
      status: "ACTIVE",
      itemEndAt: { lte: now },
      auction: { status: "OPEN" },
    },
    include: {
      bids: { where: { status: "ACTIVE" }, orderBy: { amount: "desc" }, take: 1 },
      auction: { include: { organization: true } },
    },
  });

  // Items using the auction's endAt (no individual extension) that has passed
  const itemsWithAuctionExpiry = await prisma.item.findMany({
    where: {
      status: "ACTIVE",
      itemEndAt: null,
      auction: { status: "OPEN", endAt: { lte: now } },
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

  // Close any OPEN auctions where endAt has passed and no ACTIVE items remain
  const affectedAuctionIds = [
    ...new Set(expiredItems.map((i) => i.auctionId).filter(Boolean)),
  ] as string[];

  let closedAuctions = 0;
  for (const auctionId of affectedAuctionIds) {
    const remaining = await prisma.item.count({ where: { auctionId, status: "ACTIVE" } });
    if (remaining === 0) {
      const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
      if (auction?.status === "OPEN") {
        await prisma.auction.update({ where: { id: auctionId }, data: { status: "CLOSED" } });
        closedAuctions++;
      }
    }
  }

  // Also close OPEN auctions past endAt with no ACTIVE items at all
  // (e.g. auction with all DRAFT items, or already fully settled)
  const emptyExpired = await prisma.auction.findMany({
    where: {
      status: "OPEN",
      endAt: { lte: now },
      items: { none: { status: "ACTIVE" } },
    },
    select: { id: true },
  });
  for (const a of emptyExpired) {
    if (!affectedAuctionIds.includes(a.id)) {
      await prisma.auction.update({ where: { id: a.id }, data: { status: "CLOSED" } });
      closedAuctions++;
    }
  }

  return { closedItems: expiredItems.length, closedAuctions };
}

/**
 * Manually close a specific auction (used by the admin "Close Auction" button).
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

  for (const item of auction.items) {
    await closeItem({
      ...item,
      auction: { id: auction.id, title: auction.title, organization: auction.organization },
    });
  }

  await prisma.auction.update({ where: { id: auctionId }, data: { status: "CLOSED" } });

  return { winnersCount: auction.items.filter((i) => i.bids.length > 0).length };
}
