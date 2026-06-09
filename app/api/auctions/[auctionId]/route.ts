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
      select: { organizationId: true },
    });
    if (!auction) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    if (!(await canAccessOrg(auction.organizationId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.auction.update({
      where: { id: auctionId },
      data: { status },
    });

    return NextResponse.json({ success: true, auction: updated });
  } catch (error) {
    console.error("Auction update error:", error);
    return NextResponse.json({ error: "Failed to update auction" }, { status: 500 });
  }
}
