import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessOrg } from "@/lib/auth";

interface Props {
  params: Promise<{ auctionId: string }>;
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { auctionId } = await params;
    const { status } = await request.json();

    const validStatuses = ["DRAFT", "OPEN", "CLOSING", "CLOSED", "SETTLED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Verify the user belongs to the org that owns this auction
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: { organization: true },
    });
    if (!auction) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    if (!(await canAccessOrg(auction.organizationId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // State machine guard — prevent illegal auction status transitions
    const auctionTransitions: Record<string, string[]> = {
      DRAFT:   ["OPEN"],
      OPEN:    ["CLOSING", "CLOSED"],
      CLOSING: ["CLOSED", "OPEN"],
      CLOSED:  ["SETTLED"],
      SETTLED: [],
    };
    const allowedAuction = auctionTransitions[auction.status] ?? [];
    if (!allowedAuction.includes(status)) {
      return NextResponse.json(
        { error: `Cannot move auction from ${auction.status} to ${status}` },
        { status: 422 }
      );
    }

    const updated = await prisma.auction.update({
      where: { id: auctionId },
      data: { status },
    });

    // When opening an auction, activate all DRAFT items and fire the started webhook
    if (status === "OPEN") {
      await prisma.item.updateMany({
        where: { auctionId, status: "DRAFT" },
        data: { status: "ACTIVE" },
      });

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
        }).catch((e) => console.error("GHL auction-started webhook failed:", e));
      }
    }

    return NextResponse.json({ success: true, auction: updated });
  } catch (error) {
    console.error("Auction update error:", error);
    return NextResponse.json({ error: "Failed to update auction" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Props) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { auctionId } = await params;
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      select: { organizationId: true, status: true },
    });
    if (!auction) return NextResponse.json({ error: "Auction not found" }, { status: 404 });

    if (!(await canAccessOrg(auction.organizationId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only DRAFT auctions can be deleted — protect live/completed auctions
    if (auction.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft auctions can be deleted" },
        { status: 422 }
      );
    }

    // Unlink items from this auction (don't delete items — they may be re-used)
    await prisma.item.updateMany({
      where: { auctionId },
      data: { auctionId: null, status: "DRAFT" },
    });

    await prisma.auction.delete({ where: { id: auctionId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Auction delete error:", error);
    return NextResponse.json({ error: "Failed to delete auction" }, { status: 500 });
  }
}
