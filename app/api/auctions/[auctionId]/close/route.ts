import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessOrg } from "@/lib/auth";

interface Props {
  params: Promise<{ auctionId: string }>;
}

export async function POST(_request: NextRequest, { params }: Props) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { auctionId } = await params;

    // Verify ownership
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

    if (!auction) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    if (!(await canAccessOrg(auction.organizationId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let winnersCount = 0;
    const winnerNotifications: Promise<void>[] = [];

    for (const item of auction.items) {
      const winningBid = item.bids[0];

      if (winningBid) {
        // Mark winning bid as WON
        await prisma.bid.update({
          where: { id: winningBid.id },
          data: { status: "WON" },
        });

        // Mark item as SOLD
        await prisma.item.update({
          where: { id: item.id },
          data: { status: "SOLD" },
        });

        // Get winner profile for notification
        const winnerProfile = await prisma.bidderProfile.findUnique({
          where: { clerkUserId: winningBid.clerkUserId },
        });

        winnersCount++;

        // Fire GHL auction won webhook (non-blocking)
        if (process.env.GHL_AUCTION_WON_WEBHOOK) {
          winnerNotifications.push(
            fetch(process.env.GHL_AUCTION_WON_WEBHOOK, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                event: "auction_won",
                bidderEmail: winnerProfile?.email || winningBid.clerkUserId,
                bidderPhone: winnerProfile?.phone || "",
                bidderName: winnerProfile?.name || "Winner",
                itemTitle: item.title,
                itemId: item.id,
                winningAmount: winningBid.amount,
                auctionName: auction.title,
                orgName: auction.organization.name,
                paymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/my-bids`,
              }),
            }).then(() => {}).catch(err => console.error("GHL won webhook failed:", err))
          );
        }
      } else {
        // No bids — mark unsold
        await prisma.item.update({
          where: { id: item.id },
          data: { status: "UNSOLD" },
        });
      }
    }

    // Mark auction closed
    await prisma.auction.update({
      where: { id: auctionId },
      data: { status: "CLOSED" },
    });

    // Fire all GHL notifications in parallel
    await Promise.allSettled(winnerNotifications);

    return NextResponse.json({ success: true, winnersCount });
  } catch (error) {
    console.error("Close auction error:", error);
    return NextResponse.json({ error: "Failed to close auction" }, { status: 500 });
  }
}
