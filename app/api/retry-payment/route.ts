import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * POST /api/retry-payment
 * Body: { itemId: string }
 *
 * Retries a failed auto-charge for an item the user won.
 * Uses the card currently on file — if that also fails, returns an error
 * so the user can update their card and try again.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { itemId } = await request.json();
    if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

    // Verify the user won this item
    const wonBid = await prisma.bid.findFirst({
      where: { itemId, clerkUserId: userId, status: "WON" },
    });
    if (!wonBid) return NextResponse.json({ error: "No winning bid found" }, { status: 404 });

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        organization: {
          select: {
            id: true,
            stripeAccountId: true,
            platformFeePercent: true,
            taxPercent: true,
          },
        },
      },
    });
    if (!item || !item.organization.stripeAccountId) {
      return NextResponse.json({ error: "Item or org not found" }, { status: 404 });
    }

    const org = item.organization;

    // Get bidder's card on file
    const bidderCustomer = await prisma.bidderStripeCustomer.findUnique({
      where: {
        clerkUserId_organizationId: { clerkUserId: userId, organizationId: org.id },
      },
    });
    if (!bidderCustomer?.defaultPaymentMethodId) {
      return NextResponse.json(
        { error: "No payment card on file. Please add a card first.", requiresPaymentMethod: true },
        { status: 422 }
      );
    }

    const bidAmount = Number(wonBid.amount);
    const taxAmount = Math.round(bidAmount * Number(org.taxPercent) / 100 * 100); // cents
    const chargeAmount = Math.round(bidAmount * 100) + taxAmount; // total cents
    const appFeeAmount = Math.round(bidAmount * Number(org.platformFeePercent) / 100 * 100); // cents

    // Create fresh PaymentIntent on the connected account
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: chargeAmount,
        currency: "usd",
        customer: bidderCustomer.stripeCustomerId,
        payment_method: bidderCustomer.defaultPaymentMethodId,
        off_session: true,
        confirm: true,
        application_fee_amount: appFeeAmount,
        metadata: { clerkUserId: userId, orgId: org.id, itemId, isRetry: "true" },
      },
      { stripeAccount: org.stripeAccountId }
    );

    if (
      paymentIntent.status === "succeeded" ||
      paymentIntent.status === "processing"
    ) {
      // Mark payment PAID and update/create Payment record
      await prisma.payment.upsert({
        where: {
          // Find existing failed payment — use a findFirst approach
          id: (
            await prisma.payment.findFirst({
              where: { itemId, clerkUserId: userId },
              select: { id: true },
            })
          )?.id ?? "none",
        },
        update: {
          status: "PAID",
          stripePaymentIntentId: paymentIntent.id,
          failureReason: null,
          autoChargeAttemptedAt: new Date(),
          applicationFeeAmount: appFeeAmount / 100,
          taxAmount: taxAmount / 100,
        },
        create: {
          clerkUserId: userId,
          itemId,
          amount: bidAmount,
          applicationFeeAmount: appFeeAmount / 100,
          taxAmount: taxAmount / 100,
          stripePaymentIntentId: paymentIntent.id,
          status: "PAID",
          autoChargeAttemptedAt: new Date(),
        },
      });

      await prisma.item.update({
        where: { id: itemId },
        data: { status: "PENDING_PICKUP" },
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Payment did not complete. Please try a different card." },
        { status: 422 }
      );
    }
  } catch (error: unknown) {
    // Stripe card decline errors
    if (
      typeof error === "object" &&
      error !== null &&
      "type" in error &&
      (error as { type: string }).type === "StripeCardError"
    ) {
      const stripeErr = error as { message?: string };
      return NextResponse.json(
        { error: stripeErr.message ?? "Card declined. Please update your payment card." },
        { status: 422 }
      );
    }
    console.error("Retry payment error:", error);
    return NextResponse.json({ error: "Payment failed. Please try again." }, { status: 500 });
  }
}
