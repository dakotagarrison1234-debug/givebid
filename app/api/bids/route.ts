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

    const minBid = item.currentBid > 0 ? item.currentBid + 5 : item.startingBid;

    if (amount < minBid) {
      return NextResponse.json({ error: `Minimum bid is $${minBid}` }, { status: 400 });
    }

    const previousActiveBid = item.bids[0];

    const outbidProfile = previousActiveBid
      ? await prisma.bidderProfile.findUnique({
          where: { clerkUserId: previousActiveBid.clerkUserId },
        })
      : null;

    await prisma.bid.updateMany({
      where: { itemId, status: "ACTIVE" },
      data: { status: "OUTBID" },
    });

    const bid = await prisma.bid.create({
      data: {
        itemId,
        clerkUserId: userId,
        amount,
        status: "ACTIVE",
      },
    });

    await prisma.item.update({
      where: { id: itemId },
      data: { currentBid: amount },
    });

    await pusher.trigger(`item-${itemId}`, "new-bid", {
      amount,
      bidId: bid.id,
      userId: userId.substring(0, 8),
      placedAt: bid.placedAt,
    });

    // GHL outbid alert
    if (previousActiveBid && previousActiveBid.clerkUserId !== userId) {
      fetch(process.env.GHL_OUTBID_WEBHOOK!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "outbid",
          bidderEmail: outbidProfile?.email || previousActiveBid.clerkUserId,
          bidderPhone: outbidProfile?.phone || "",
          bidderName: outbidProfile?.name || "Bidder",
          itemTitle: item.title,
          itemUrl: `${process.env.NEXT_PUBLIC_APP_URL}`,
          outbidAmount: previousActiveBid.amount,
          newBidAmount: amount,
          auctionName: item.auction?.title || "Auction",
          orgName: item.organization?.name || "Organization",
        }),
      }).catch(err => console.error("GHL outbid webhook failed:", err));
    }

    // GHL bid confirmation for the new bidder
    const newBidderProfile = await prisma.bidderProfile.findUnique({
      where: { clerkUserId: userId },
    });
    if (process.env.GHL_BID_CONFIRM_WEBHOOK) {
      fetch(process.env.GHL_BID_CONFIRM_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "bid_confirmed",
          bidderEmail: newBidderProfile?.email || userId,
          bidderPhone: newBidderProfile?.phone || "",
          bidderName: newBidderProfile?.name || "Bidder",
          itemTitle: item.title,
          bidAmount: amount,
          auctionName: item.auction?.title || "Auction",
          orgName: item.organization?.name || "Organization",
        }),
      }).catch(err => console.error("GHL bid confirm webhook failed:", err));
    }

    return NextResponse.json({ success: true, bid });

  } catch (error) {
    console.error("Bid error:", error);
    return NextResponse.json({ error: "Failed to place bid" }, { status: 500 });
  }
}