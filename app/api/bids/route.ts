import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Pusher from "pusher";
import { getNextValidBid } from "@/lib/bidIncrements";
import { resolveProxiesAfterBid } from "@/lib/proxyBidResolver";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

const POPCORN_WINDOW_MS = 150_000; // 2 min 30 sec
const POPCORN_EXTENSION_MS = 150_000;

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

    // Validate item and auction status
    if (item.status !== "ACTIVE") {
      return NextResponse.json({ error: "This item is not currently accepting bids" }, { status: 400 });
    }
    if (!item.auction || (item.auction.status !== "OPEN" && item.auction.status !== "CLOSING")) {
      return NextResponse.json({ error: "This auction is not currently open" }, { status: 400 });
    }

    // Enforce per-item end time (popcorn-aware)
    const effectiveEndAt = item.itemEndAt ?? item.auction.endAt;
    if (new Date() > effectiveEndAt) {
      return NextResponse.json({ error: "Bidding for this item has ended" }, { status: 400 });
    }

    // Require a completed bidder profile
    const profile = await prisma.bidderProfile.findUnique({ where: { clerkUserId: userId } });
    if (!profile?.phone || !profile?.email) {
      return NextResponse.json(
        { error: "You must complete registration before bidding", requiresRegistration: true },
        { status: 403 }
      );
    }

    // Use the real increment table (not hardcoded +5)
    const minBid = item.currentBid > 0 ? getNextValidBid(item.currentBid) : item.startingBid;
    if (amount < minBid) {
      return NextResponse.json({ error: `Minimum bid is $${minBid}` }, { status: 400 });
    }

    const previousActiveBid = item.bids[0];
    const outbidProfile = previousActiveBid
      ? await prisma.bidderProfile.findUnique({ where: { clerkUserId: previousActiveBid.clerkUserId } })
      : null;

    // Popcorn bidding: extend item end time if bid placed in last 2:30
    let newItemEndAt: Date | null = null;
    const timeLeft = effectiveEndAt.getTime() - Date.now();
    if (timeLeft < POPCORN_WINDOW_MS) {
      newItemEndAt = new Date(Date.now() + POPCORN_EXTENSION_MS);
    }

    // Record the manual bid atomically
    const bid = await prisma.$transaction(async (tx) => {
      await tx.bid.updateMany({ where: { itemId, status: "ACTIVE" }, data: { status: "OUTBID" } });
      const newBid = await tx.bid.create({
        data: { itemId, clerkUserId: userId, amount, status: "ACTIVE", isProxy: false },
      });
      await tx.item.update({
        where: { id: itemId },
        data: {
          currentBid: amount,
          ...(newItemEndAt ? { itemEndAt: newItemEndAt } : {}),
        },
      });
      return newBid;
    });

    // After the manual bid is saved, check if any proxy should fire back
    const proxyResult = await resolveProxiesAfterBid(itemId, amount, userId);

    // If a proxy fired, the Pusher event is already sent by resolveProxiesAfterBid.
    // Only broadcast the manual bid event if no proxy fired (otherwise the proxy event supersedes it).
    if (!proxyResult.proxyFired) {
      await pusher.trigger(`item-${itemId}`, "new-bid", {
        amount,
        bidId: bid.id,
        userId: userId.substring(0, 8),
        placedAt: bid.placedAt,
        isProxy: false,
        hasActiveProxy: proxyResult.hasActiveProxy,
        ...(newItemEndAt ? { newEndAt: newItemEndAt.toISOString() } : {}),
      });
    }

    // GHL outbid alert (only fire if the proxy didn't already outbid the previous holder)
    if (
      !proxyResult.proxyFired &&
      previousActiveBid &&
      previousActiveBid.clerkUserId !== userId &&
      process.env.GHL_OUTBID_WEBHOOK
    ) {
      const outbidEmail = outbidProfile?.email || "";
      const outbidPhone = outbidProfile?.phone || "";
      const outbidName = outbidProfile?.name || "Bidder";
      const itemUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${item.organization?.slug}/${item.auction?.slug}/item/${item.id}`;
      fetch(process.env.GHL_OUTBID_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: outbidEmail,
          phone: outbidPhone,
          name: outbidName,
          firstName: outbidName.split(" ")[0] || outbidName,
          lastName: outbidName.split(" ").slice(1).join(" ") || "",
          event: "outbid",
          bidderEmail: outbidEmail,
          bidderPhone: outbidPhone,
          bidderName: outbidName,
          itemTitle: item.title,
          itemUrl,
          outbidAmount: previousActiveBid.amount,
          newBidAmount: amount,
          auctionName: item.auction?.title || "Auction",
          orgName: item.organization?.name || "Organization",
        }),
      }).catch((err) => console.error("GHL outbid webhook failed:", err));
    }

    // GHL bid confirmation (for the manual bidder — only if they're still the winner)
    // If a proxy fired back, the proxy owner's confirmation is handled by the resolver.
    // The manual bidder was outbid — we skip their "bid confirmed" (they get "outbid" instead).
    if (!proxyResult.proxyFired && process.env.GHL_BID_CONFIRM_WEBHOOK) {
      const confirmEmail = profile.email || "";
      const confirmPhone = profile.phone || "";
      const confirmName = profile.name || "Bidder";
      const itemUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${item.organization?.slug}/${item.auction?.slug}/item/${item.id}`;
      fetch(process.env.GHL_BID_CONFIRM_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: confirmEmail,
          phone: confirmPhone,
          name: confirmName,
          firstName: confirmName.split(" ")[0] || confirmName,
          lastName: confirmName.split(" ").slice(1).join(" ") || "",
          event: "bid_confirmed",
          bidderEmail: confirmEmail,
          bidderPhone: confirmPhone,
          bidderName: confirmName,
          itemTitle: item.title,
          itemUrl,
          bidAmount: amount,
          auctionName: item.auction?.title || "Auction",
          orgName: item.organization?.name || "Organization",
        }),
      }).catch((err) => console.error("GHL bid confirm webhook failed:", err));
    }

    // If proxy fired, the new effective amount and end time come from the proxy resolution
    const finalAmount = proxyResult.proxyFired ? proxyResult.newAmount : amount;
    const finalEndAt = proxyResult.proxyFired
      ? (proxyResult.newEndAt ?? newItemEndAt?.toISOString() ?? null)
      : (newItemEndAt?.toISOString() ?? null);

    return NextResponse.json({
      success: true,
      bid,
      proxyFired: proxyResult.proxyFired,
      newEndAt: finalEndAt,
      currentBid: finalAmount,
    });
  } catch (error) {
    console.error("Bid error:", error);
    return NextResponse.json({ error: "Failed to place bid" }, { status: 500 });
  }
}
