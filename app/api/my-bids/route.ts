import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [wonBids, activeBids] = await Promise.all([
    prisma.bid.findMany({
      where: { clerkUserId: userId, status: "WON" },
      include: {
        item: {
          include: {
            photos: true,
            auction: {
              include: { organization: true },
            },
          },
        },
      },
      orderBy: { placedAt: "desc" },
    }),
    prisma.bid.findMany({
      where: { clerkUserId: userId, status: "ACTIVE" },
      include: {
        item: {
          include: {
            photos: true,
            auction: {
              include: { organization: true },
            },
          },
        },
      },
      orderBy: { amount: "desc" },
    }),
  ]);

  const wonItems = wonBids.map((bid) => ({
    id: bid.item.id,
    title: bid.item.title,
    currentBid: bid.item.currentBid,
    status: bid.item.status,
    photos: bid.item.photos,
    auction: bid.item.auction
      ? {
          title: bid.item.auction.title,
          slug: bid.item.auction.slug,
          organization: {
            name: bid.item.auction.organization.name,
            slug: bid.item.auction.organization.slug,
          },
        }
      : null,
  }));

  const activeBidsFormatted = activeBids.map((bid) => ({
    id: bid.id,
    amount: bid.amount,
    item: {
      id: bid.item.id,
      title: bid.item.title,
      currentBid: bid.item.currentBid,
      photos: bid.item.photos,
      auction: bid.item.auction
        ? {
            title: bid.item.auction.title,
            slug: bid.item.auction.slug,
            endAt: bid.item.auction.endAt,
            status: bid.item.auction.status,
            organization: { slug: bid.item.auction.organization.slug },
          }
        : null,
    },
  }));

  return NextResponse.json({ wonItems, activeBids: activeBidsFormatted });
}
