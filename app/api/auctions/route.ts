import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, startAt, endAt, organizationId } = body;

    if (!title || !startAt || !endAt || !organizationId) {
      return NextResponse.json(
        { error: "Title, dates, and organization are required" },
        { status: 400 }
      );
    }

    const slug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const auction = await prisma.auction.create({
      data: {
        title,
        description: description || null,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        slug,
        organizationId,
      },
    });

    return NextResponse.json({ success: true, auction }, { status: 201 });
  } catch (error) {
    console.error("Error creating auction:", error);
    return NextResponse.json(
      { error: "Failed to create auction" },
      { status: 500 }
    );
  }
}