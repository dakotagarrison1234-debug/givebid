import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
console.log("DB URL:", process.env.DATABASE_URL?.substring(0, 50));

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const {
      title,
      description,
      condition,
      category,
      retailValue,
      startingBid,
      reservePrice,
      donorName,
      taxDeductible,
      storageLocation,
      notes,
      auctionId,
      organizationId,
    } = body;

    if (!title || !organizationId) {
      return NextResponse.json(
        { error: "Title and organization are required" },
        { status: 400 }
      );
    }

    const item = await prisma.item.create({
      data: {
        title,
        description: description || null,
        condition: condition || "GOOD",
        category: category || null,
        retailValue: retailValue ? parseFloat(retailValue) : null,
        startingBid: startingBid ? parseFloat(startingBid) : 0,
        reservePrice: reservePrice ? parseFloat(reservePrice) : null,
        donorName: donorName || null,
        taxDeductible: taxDeductible || false,
        storageLocation: storageLocation || null,
        notes: notes || null,
        auctionId: auctionId || null,
        organizationId,
      },
    });

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await prisma.item.findMany({
      include: {
        photos: true,
        bids: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}