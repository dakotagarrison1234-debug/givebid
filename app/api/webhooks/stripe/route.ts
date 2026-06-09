import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { itemIds, clerkUserId } = session.metadata || {};

    if (!itemIds || !clerkUserId) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const itemIdList = itemIds.split(",").filter(Boolean);
    const paymentIntentId = session.payment_intent as string;
    const amountPerItem = (session.amount_total || 0) / 100 / itemIdList.length;

    try {
      for (const itemId of itemIdList) {
        // Upsert payment record
        const existing = await prisma.payment.findFirst({ where: { itemId, clerkUserId } });
        if (existing) {
          await prisma.payment.update({
            where: { id: existing.id },
            data: { status: "PAID", stripePaymentIntentId: paymentIntentId },
          });
        } else {
          await prisma.payment.create({
            data: {
              clerkUserId,
              itemId,
              amount: amountPerItem,
              stripePaymentIntentId: paymentIntentId,
              status: "PAID",
            },
          });
        }

        // Move item to PENDING_PICKUP
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await prisma.item.update({ where: { id: itemId }, data: { status: "PENDING_PICKUP" as any } });
      }

      // Get all items + winner profile for receipt notification
      const items = await prisma.item.findMany({
        where: { id: { in: itemIdList } },
        include: { auction: true, organization: true },
      });
      const winnerProfile = await prisma.bidderProfile.findUnique({ where: { clerkUserId } });

      // GHL payment receipt webhook — one notification for the whole batch
      if (process.env.GHL_PAYMENT_RECEIPT_WEBHOOK && items.length > 0) {
        const totalPaid = (session.amount_total || 0) / 100;
        const orgName = items[0].organization?.name || "Organization";
        const auctionName = items[0].auction?.title || "Auction";
        const itemSummary = items.map((i) => i.title).join(", ");

        fetch(process.env.GHL_PAYMENT_RECEIPT_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "payment_received",
            bidderEmail: winnerProfile?.email || clerkUserId,
            bidderPhone: winnerProfile?.phone || "",
            bidderName: winnerProfile?.name || "Winner",
            itemCount: items.length,
            itemSummary,
            totalAmountPaid: totalPaid,
            auctionName,
            orgName,
          }),
        }).catch((err) => console.error("GHL receipt webhook failed:", err));
      }
    } catch (err) {
      console.error("Error processing Stripe webhook:", err);
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
