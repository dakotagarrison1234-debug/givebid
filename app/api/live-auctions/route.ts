export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/live-auctions
 * Public — returns all OPEN auctions with org info and item stats.
 */
export async function GET() {
  try {
    const auctions = await prisma.auction.findMany({
      where: { status: "OPEN" },
      include: {
        organization: { select: { id: true, name: true, slug: true, logoUrl: true } },
        items: { select: { currentBid: true, status: true } },
      },
      orderBy: { endAt: "asc" },
    });

    return NextResponse.json({
      auctions: auctions.map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        endAt: a.endAt.toISOString(),
        description: a.description,
        org: a.organization,
        activeItems: a.items.filter((i) => i.status === "ACTIVE").length,
        raised: a.items.reduce((s, i) => s + Number(i.currentBid), 0),
      })),
    });
  } catch (error) {
    console.error("Live auctions error:", error);
    return NextResponse.json({ error: "Failed to fetch auctions" }, { status: 500 });
  }
}
