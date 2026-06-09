export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile, allBids] = await Promise.all([
    prisma.bidderProfile.findUnique({ where: { clerkUserId: userId } }),
    prisma.bid.findMany({
      where: { clerkUserId: userId },
      include: {
        item: {
          include: {
            photos: { where: { isPrimary: true }, take: 1 },
            auction: { include: { organization: { select: { name: true, slug: true } } } },
          },
        },
      },
      orderBy: { placedAt: "desc" },
    }),
  ]);

  // One entry per item — most recent bid (desc order guarantees this)
  const seen = new Set<string>();
  const latestBids: typeof allBids = [];
  for (const bid of allBids) {
    if (!seen.has(bid.itemId)) {
      seen.add(bid.itemId);
      latestBids.push(bid);
    }
  }

  const winning = [];
  const losing = [];
  const past = [];
  const unpaidWins = [];

  for (const bid of latestBids) {
    const item = bid.item;
    const auction = item.auction;
    if (!auction) continue;

    const photo = item.photos[0]?.url ?? null;
    const base = {
      itemId: item.id,
      itemTitle: item.title,
      itemStatus: item.status,
      photo,
      auctionTitle: auction.title,
      auctionSlug: auction.slug,
      auctionEndAt: auction.endAt,
      auctionStatus: auction.status,
      orgName: auction.organization.name,
      orgSlug: auction.organization.slug,
    };

    const auctionOpen = auction.status === "OPEN";
    const auctionClosed = auction.status === "CLOSED" || auction.status === "SETTLED";

    if (auctionOpen) {
      if (bid.status === "ACTIVE") {
        winning.push({ ...base, myBid: bid.amount, currentBid: item.currentBid, itemEndAt: item.itemEndAt });
      } else if (bid.status === "OUTBID") {
        losing.push({ ...base, myBid: bid.amount, currentBid: item.currentBid, itemEndAt: item.itemEndAt });
      }
    } else if (auctionClosed) {
      if (bid.status === "WON") {
        const paid = item.status === "PENDING_PICKUP" || item.status === "PICKED_UP";
        if (!paid) {
          unpaidWins.push({ ...base, amountOwed: item.currentBid });
        } else {
          past.push({ ...base, myBid: bid.amount, finalBid: item.currentBid, outcome: "won", paid: true });
        }
      } else {
        past.push({ ...base, myBid: bid.amount, finalBid: item.currentBid, outcome: "lost", paid: false });
      }
    }
  }

  return NextResponse.json({ profile, winning, losing, past, unpaidWins });
}
