import type Stripe from 'stripe';
import { TRPCError } from '@trpc/server';
import { getStripe } from '../lib/stripe';
import { env } from '../config/env';
import type { SubscriptionTier, BillingPeriod } from '@fitnassist/database';

type PaidTier = Exclude<SubscriptionTier, 'FREE' | 'BASIC'>;

const PRICE_ID_MAP: Record<PaidTier, Record<BillingPeriod, string | undefined>> = {
  PRO: {
    MONTHLY: env.STRIPE_PRICE_ID_PRO_MONTHLY,
    ANNUAL: env.STRIPE_PRICE_ID_PRO_ANNUAL,
  },
  ELITE: {
    MONTHLY: env.STRIPE_PRICE_ID_ELITE_MONTHLY,
    ANNUAL: env.STRIPE_PRICE_ID_ELITE_ANNUAL,
  },
};

const PRICE_ID_TO_TIER: Record<string, { tier: PaidTier; billingPeriod: BillingPeriod }> = {};

// Build reverse lookup at startup
for (const [tier, periods] of Object.entries(PRICE_ID_MAP)) {
  for (const [period, priceId] of Object.entries(periods)) {
    if (priceId) {
      PRICE_ID_TO_TIER[priceId] = {
        tier: tier as PaidTier,
        billingPeriod: period as BillingPeriod,
      };
    }
  }
}

export const stripeService = {
  createCustomer: async (email: string, name: string, trainerId: string): Promise<Stripe.Customer> => {
    const stripe = getStripe();
    return stripe.customers.create({
      email,
      name,
      metadata: { trainerId },
    });
  },

  createCheckoutSession: async (
    stripeCustomerId: string,
    tier: PaidTier,
    billingPeriod: BillingPeriod,
    successUrl: string,
    cancelUrl: string,
    couponId?: string
  ): Promise<Stripe.Checkout.Session> => {
    const stripe = getStripe();
    const priceId = PRICE_ID_MAP[tier]?.[billingPeriod];

    if (!priceId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `No price configured for ${tier} ${billingPeriod}`,
      });
    }

    return stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: { tier, billingPeriod },
      },
      ...(couponId ? { discounts: [{ coupon: couponId }] } : {}),
    });
  },

  createPortalSession: async (
    stripeCustomerId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> => {
    const stripe = getStripe();
    return stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });
  },

  constructWebhookEvent: (
    body: Buffer,
    signature: string
  ): Stripe.Event => {
    const stripe = getStripe();
    const secret = env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }
    return stripe.webhooks.constructEvent(body, signature, secret);
  },

  lookupTierFromPriceId: (priceId: string): { tier: PaidTier; billingPeriod: BillingPeriod } | null => {
    return PRICE_ID_TO_TIER[priceId] ?? null;
  },
};
