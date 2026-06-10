import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

const POPCORN_WINDOW_MS = 150_000; // 2 min 30 sec
const POPCORN_EXTENSION_MS = 150_000;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId, amount } = await request.json();
    if (!itemId || !amount) {
      return NextResponse.json({ error: "Item and amount required" }, { status: 400 });
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        bids: { where: { status: "ACTIVE" } },
        auction: true,
        organization: true,
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Validate item and auction status
    if (item.status !== "ACTIVE") {
      return NextResponse.json({ error: "This item is not currently accepting bids" }, { status: 400 });
    }
    if (!item.auction || item.auction.status !== "OPEN") {
      return NextResponse.json({ error: "This auction is not currently open" }, { status: 400 });
    }

    // Enforce per-item end time (popcorn-aware)
    const effectiveEndAt = item.itemEndAt ?? item.auction.endAt;
    if (new Date() > effectiveEndAt) {
      return NextResponse.json({ error: "Bidding for this item has ended" }, { status: 400 });
    }

    // Require a completed bidder profile
    const profile = await prisma.bidderProfile.findUnique({ where: { clerkUserId: userId } });
    if (!profile?.phone || !profile?.email) {
      return NextResponse.json(
        { error: "You must complete registration before bidding", requiresRegistration: true },
        { status: 403 }
      );
    }

    const minBid = item.currentBid > 0 ? item.currentBid + 5 : item.startingBid;
    if (amount < minBid) {
      return NextResponse.json({ error: `Minimum bid is $${minBid}` }, { status: 400 });
    }

    const previousActiveBid = item.bids[0];
    const outbidProfile = previousActiveBid
      ? await prisma.bidderProfile.findUnique({ where: { clerkUserId: previousActiveBid.clerkUserId } })
      : null;

    // Popcorn bidding: extend item end time if bid placed in last 2:30
    let newItemEndAt: Date | null = null;
    const timeLeft = effectiveEndAt.getTime() - Date.now();
    if (timeLeft < POPCORN_WINDOW_MS) {
      newItemEndAt = new Date(Date.now() + POPCORN_EXTENSION_MS);
    }

    // Record the bid atomically — prevents race conditions under concurrent bids
    const bid = await prisma.$transaction(async (tx) => {
      await tx.bid.updateMany({ where: { itemId, status: "ACTIVE" }, data: { status: "OUTBID" } });
      const newBid = await tx.bid.create({
        data: { itemId, clerkUserId: userId, amount, status: "ACTIVE" },
      });
      await tx.item.update({
        where: { id: itemId },
        data: {
          currentBid: amount,
          ...(newItemEndAt ? { itemEndAt: newItemEndAt } : {}),
        },
      });
      return newBid;
    });

    // Broadcast bid + new end time (if extended) to all watchers
    await pusher.trigger(`item-${itemId}`, "new-bid", {
      amount,
      bidId: bid.id,
      userId: userId.substring(0, 8),
      placedAt: bid.placedAt,
      ...(newItemEndAt ? { newEndAt: newItemEndAt.toISOString() } : {}),
    });

    // GHL outbid alert
    if (previousActiveBid && previousActiveBid.clerkUserId !== userId && process.env.GHL_OUTBID_WEBHOOK) {
      fetch(process.env.GHL_OUTBID_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "outbid",
          bidderEmail: outbidProfile?.email || previousActiveBid.clerkUserId,
          bidderPhone: outbidProfile?.phone || "",
          bidderName: outbidProfile?.name || "Bidder",
          itemTitle: item.title,
          itemUrl: `${process.env.NEXT_PUBLIC_APP_URL}/${item.organization?.slug}/${item.auction?.slug}/item/${item.id}`,
          outbidAmount: previousActiveBid.amount,
          newBidAmount: amount,
          auctionName: item.auction?.title || "Auction",
          orgName: item.organization?.name || "Organization",
        }),
      }).catch((err) => console.error("GHL outbid webhook failed:", err));
    }

    // GHL bid confirmation
    if (process.env.GHL_BID_CONFIRM_WEBHOOK) {
      fetch(process.env.GHL_BID_CONFIRM_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "bid_confirmed",
          bidderEmail: profile.email,
          bidderPhone: profile.phone || "",
          bidderName: profile.name || "Bidder",
          itemTitle: item.title,
          bidAmount: amount,
          auctionName: item.auction?.title || "Auction",
          orgName: item.organization?.name || "Organization",
        }),
      }).catch((err) => console.error("GHL bid confirm webhook failed:", err));
    }

    return NextResponse.json({ success: true, bid, newEndAt: newItemEndAt?.toISOString() ?? null });
  } catch (error) {
    console.error("Bid error:", error);
    return NextResponse.json({ error: "Failed to place bid" }, { status: 500 });
  }
}
