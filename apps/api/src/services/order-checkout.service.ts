import { TRPCError } from "@trpc/server";
import { getStripe } from "../lib/stripe";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";

const PLATFORM_FEE_PERCENT = 0.03; // 3% — matches product-payment.service.ts

export const orderCheckoutService = {
  /**
   * Create a Stripe Checkout Session for an existing order (for mobile clients that cannot use Stripe Elements).
   * Returns the hosted checkout URL.
   */
  async createCheckoutSession(
    orderId: string,
    buyerUserId: string,
    successUrl?: string,
    cancelUrl?: string,
  ) {
    const order = await prisma.productOrder.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!order) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
    }

    if (order.buyerUserId !== buyerUserId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the buyer can pay for this order",
      });
    }

    if (order.status !== "PENDING_PAYMENT") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Order is not awaiting payment",
      });
    }

    // Get trainer's Stripe Connect account
    const trainer = await prisma.trainerProfile.findUnique({
      where: { id: order.trainerId },
      select: {
        stripeConnectedAccountId: true,
        stripeOnboardingComplete: true,
        paymentsEnabled: true,
      },
    });

    if (
      !trainer?.paymentsEnabled ||
      !trainer.stripeConnectedAccountId ||
      !trainer.stripeOnboardingComplete
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Trainer has not enabled payments",
      });
    }

    const stripe = getStripe();

    const platformFeePence = Math.round(
      order.totalPence * PLATFORM_FEE_PERCENT,
    );

    const resolvedSuccessUrl =
      successUrl ??
      `${env.FRONTEND_URL}/dashboard/purchases?order=${orderId}&payment=success`;
    const resolvedCancelUrl =
      cancelUrl ??
      `${env.FRONTEND_URL}/dashboard/purchases?order=${orderId}&payment=cancelled`;

    const lineItems = order.items.map((item) => ({
      price_data: {
        currency: "gbp",
        unit_amount: item.pricePence,
        product_data: { name: item.productName },
      },
      quantity: item.quantity,
    }));

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      payment_intent_data: {
        application_fee_amount: platformFeePence,
        transfer_data: {
          destination: trainer.stripeConnectedAccountId,
        },
        metadata: {
          type: "product_order",
          orderId,
          trainerId: order.trainerId,
          buyerUserId,
          platform: "fitnassist",
        },
      },
      success_url: resolvedSuccessUrl,
      cancel_url: resolvedCancelUrl,
      metadata: {
        type: "product_order",
        orderId,
        trainerId: order.trainerId,
        buyerUserId,
      },
    });

    // Update the order with the checkout session's payment intent ID if available
    if (checkoutSession.payment_intent) {
      await prisma.productOrder.update({
        where: { id: orderId },
        data: {
          stripePaymentIntentId: checkoutSession.payment_intent as string,
        },
      });
    }

    return { url: checkoutSession.url! };
  },
};
