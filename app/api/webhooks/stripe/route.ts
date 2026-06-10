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
    const { batchId, clerkUserId } = session.metadata || {};

    if (!batchId || !clerkUserId) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    // Look up the batch record for item IDs (avoids 500-char Stripe metadata limit)
    const batch = await prisma.paymentBatch.findUnique({ where: { id: batchId } });
    if (!batch) {
      console.error("PaymentBatch not found:", batchId);
      return NextResponse.json({ error: "Batch not found" }, { status: 400 });
    }

    const itemIdList: string[] = JSON.parse(batch.itemIds);
    const paymentIntentId = session.payment_intent as string;

    // Fetch items with their winning bid amounts for accurate per-item payment records
    const items = await prisma.item.findMany({
      where: { id: { in: itemIdList } },
      include: {
        auction: true,
        organization: true,
        bids: { where: { clerkUserId, status: "WON" }, orderBy: { amount: "desc" }, take: 1 },
      },
    });

    try {
      for (const item of items) {
        const winningBidAmount = item.bids[0]?.amount ?? item.currentBid;

        // Upsert payment record
        const existing = await prisma.payment.findFirst({ where: { itemId: item.id, clerkUserId } });
        if (existing) {
          await prisma.payment.update({
            where: { id: existing.id },
            data: { status: "PAID", stripePaymentIntentId: paymentIntentId },
          });
        } else {
          await prisma.payment.create({
            data: {
              clerkUserId,
              itemId: item.id,
              amount: winningBidAmount,
              stripePaymentIntentId: paymentIntentId,
              status: "PAID",
            },
          });
        }

        // Move item to PENDING_PICKUP (only if currently SOLD — idempotent guard)
        if (item.status === "SOLD") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await prisma.item.update({ where: { id: item.id }, data: { status: "PENDING_PICKUP" as any } });
        }
      }

      // Payment receipt is handled by Stripe's built-in email receipts
    } catch (err) {
      console.error("Error processing Stripe webhook:", err);
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
