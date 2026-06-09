import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    // Accept either a single itemId or an array of itemIds
    const itemIds: string[] = body.itemIds
      ? body.itemIds
      : body.itemId
      ? [body.itemId]
      : [];

    if (itemIds.length === 0) {
      return NextResponse.json({ error: "No items specified" }, { status: 400 });
    }

    // Load all items with their winning bids
    const items = await prisma.item.findMany({
      where: { id: { in: itemIds } },
      include: {
        bids: {
          where: { clerkUserId: userId, status: "WON" },
          orderBy: { amount: "desc" },
          take: 1,
        },
      },
    });

    // Filter to items that have a winning bid and are not already paid
    const payableItems = items.filter(
      (item) => item.bids.length > 0 && item.status !== "PENDING_PICKUP" && item.status !== "PICKED_UP"
    );

    if (payableItems.length === 0) {
      return NextResponse.json({ error: "No unpaid winning bids found" }, { status: 400 });
    }

    // Build Stripe line items
    const lineItems = payableItems.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.title,
          description: item.description || undefined,
        },
        unit_amount: Math.round(item.bids[0].amount * 100),
      },
      quantity: 1,
    }));

    // Store itemIds + bidIds in metadata (comma-separated, up to ~20 items)
    const metaItemIds = payableItems.map((i) => i.id).join(",");
    const metaBidIds = payableItems.map((i) => i.bids[0].id).join(",");

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/my-bids`,
      metadata: {
        itemIds: metaItemIds,
        bidIds: metaBidIds,
        clerkUserId: userId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
  }
}
