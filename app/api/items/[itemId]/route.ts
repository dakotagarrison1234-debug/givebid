import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        photos: true,
        bids: {
          orderBy: { placedAt: "desc" },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Error fetching item:", error);
    return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await request.json();

    await prisma.item.update({
      where: { id: itemId },
      data: {
        title: body.title,
        description: body.description || null,
        condition: body.condition || "GOOD",
        category: body.category || null,
        retailValue: body.retailValue ? parseFloat(body.retailValue) : null,
        startingBid: body.startingBid ? parseFloat(body.startingBid) : 0,
        reservePrice: body.reservePrice ? parseFloat(body.reservePrice) : null,
        donorName: body.donorName || null,
        taxDeductible: body.taxDeductible || false,
        storageLocation: body.storageLocation || null,
        notes: body.notes || null,
        auctionId: body.auctionId || null,
      },
    });

    if (body.photos) {
      await prisma.itemPhoto.deleteMany({ where: { itemId } });
      if (body.photos.length > 0) {
        await prisma.itemPhoto.createMany({
          data: body.photos.map((url: string, index: number) => ({
            itemId,
            url,
            isPrimary: index === 0,
          })),
        });
      }
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { photos: true },
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}