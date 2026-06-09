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
      include: { bids: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const minBid = item.currentBid > 0 ? item.currentBid + 5 : item.startingBid;

    if (amount < minBid) {
      return NextResponse.json(
        { error: `Minimum bid is $${minBid}` },
        { status: 400 }
      );
    }

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

    return NextResponse.json({ success: true, bid });
  } catch (error) {
    console.error("Bid error:", error);
    return NextResponse.json({ error: "Failed to place bid" }, { status: 500 });
  }
}