import { TRPCError } from '@trpc/server';
import type { SubscriptionTier, SubscriptionStatus } from '@fitnassist/database';
import { subscriptionRepository } from '../repositories/subscription.repository';
import { stripeService } from './stripe.service';
import { referralService } from './referral.service';
import { hasTierAccess } from '../config/features';
import { TRIAL_DURATION_DAYS } from '@fitnassist/schemas';
import { prisma } from '../lib/prisma';

const TRIAL_TIER_VALUE: SubscriptionTier = 'PRO';

export const subscriptionService = {
  /**
   * Get the effective tier for a trainer, considering subscription status and trial.
   */
  getEffectiveTier: async (trainerId: string): Promise<SubscriptionTier> => {
    const subscription = await subscriptionRepository.findByTrainerId(trainerId);
    if (!subscription) return 'FREE';

    if (subscription.status === 'TRIALING') {
      // Check if trial is still valid
      if (subscription.trialEndDate && new Date() < subscription.trialEndDate) {
        return TRIAL_TIER_VALUE;
      }
      // Trial expired — treat as FREE
      return 'FREE';
    }

    if (subscription.status === 'ACTIVE') {
      return subscription.tier;
    }

    // PAST_DUE: still grant access (grace period)
    if (subscription.status === 'PAST_DUE') {
      return subscription.tier;
    }

    // CANCELED, UNPAID, INCOMPLETE → FREE
    return 'FREE';
  },

  getCurrentSubscription: async (trainerId: string) => {
    return subscriptionRepository.findByTrainerId(trainerId);
  },

  /**
   * Check if trainer has access to a specific tier.
   */
  checkTierAccess: async (
    trainerId: string,
    requiredTier: SubscriptionTier
  ): Promise<boolean> => {
    const effectiveTier = await subscriptionService.getEffectiveTier(trainerId);
    return hasTierAccess(effectiveTier, requiredTier);
  },

  /**
   * Create a subscription record for a new trainer (trial).
   */
  createTrialSubscription: async (
    trainerId: string,
    email: string,
    name: string
  ) => {
    // Create Stripe customer
    const customer = await stripeService.createCustomer(email, name, trainerId);

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DURATION_DAYS);

    // Create subscription record
    const subscription = await subscriptionRepository.create({
      trainerId,
      stripeCustomerId: customer.id,
      status: 'TRIALING',
      tier: TRIAL_TIER_VALUE,
      trialStartDate: now,
      trialEndDate: trialEnd,
    });

    // Update trainer profile tier
    await subscriptionRepository.updateTrainerTier(trainerId, TRIAL_TIER_VALUE);

    return subscription;
  },

  /**
   * Create a checkout session for upgrading/subscribing.
   */
  /**
   * Ensure a subscription record + Stripe customer exist for a trainer.
   * Auto-provisions for existing trainers who don't have one yet.
   */
  ensureSubscriptionRecord: async (trainerId: string) => {
    const existing = await subscriptionRepository.findByTrainerId(trainerId);
    if (existing) return existing;

    // Look up trainer + user to create Stripe customer
    const trainer = await prisma.trainerProfile.findUnique({
      where: { id: trainerId },
      include: { user: { select: { email: true, name: true } } },
    });

    if (!trainer?.user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Trainer profile not found',
      });
    }

    // Create Stripe customer + subscription record (free, no trial for existing trainers)
    const customer = await stripeService.createCustomer(
      trainer.user.email,
      trainer.user.name ?? trainer.displayName,
      trainerId
    );

    return subscriptionRepository.create({
      trainerId,
      stripeCustomerId: customer.id,
      status: 'ACTIVE',
      tier: 'FREE',
    });
  },

  createCheckoutSession: async (
    trainerId: string,
    tier: Exclude<SubscriptionTier, 'FREE' | 'BASIC'>,
    billingPeriod: 'MONTHLY' | 'ANNUAL',
    frontendUrl: string
  ) => {
    const subscription = await subscriptionService.ensureSubscriptionRecord(trainerId);

    // Check if the trainer was referred and should get a discount
    const trainer = await prisma.trainerProfile.findUnique({
      where: { id: trainerId },
      select: { userId: true },
    });
    const referralCouponId = trainer
      ? await referralService.getReferredDiscount(trainer.userId)
      : null;

    const session = await stripeService.createCheckoutSession(
      subscription.stripeCustomerId,
      tier,
      billingPeriod,
      `${frontendUrl}/dashboard/settings?tab=subscription&session_id={CHECKOUT_SESSION_ID}`,
      `${frontendUrl}/pricing`,
      referralCouponId ?? undefined
    );

    return { url: session.url };
  },

  /**
   * Create a Stripe billing portal session for managing subscription.
   */
  createPortalSession: async (trainerId: string, frontendUrl: string) => {
    const subscription = await subscriptionService.ensureSubscriptionRecord(trainerId);

    const session = await stripeService.createPortalSession(
      subscription.stripeCustomerId,
      `${frontendUrl}/dashboard/settings?tab=subscription`
    );

    return { url: session.url };
  },

  /**
   * Handle Stripe webhook: subscription created/updated.
   */
  handleSubscriptionUpdate: async (
    stripeSubscriptionId: string,
    stripeCustomerId: string,
    status: string,
    priceId: string | null,
    currentPeriodStart: number | null,
    currentPeriodEnd: number | null,
    cancelAtPeriodEnd: boolean,
    canceledAt: number | null
  ) => {
    const subscription = await subscriptionRepository.findByStripeCustomerId(stripeCustomerId);
    if (!subscription) {
      console.error(`No subscription found for Stripe customer ${stripeCustomerId}`);
      return;
    }

    // Map Stripe status to our status
    const statusMap: Record<string, SubscriptionStatus> = {
      trialing: 'TRIALING',
      active: 'ACTIVE',
      past_due: 'PAST_DUE',
      canceled: 'CANCELED',
      unpaid: 'UNPAID',
      incomplete: 'INCOMPLETE',
    };

    const mappedStatus = statusMap[status] ?? 'INCOMPLETE';

    // Determine tier from price ID
    let tier: SubscriptionTier = subscription.tier;
    let billingPeriod = subscription.billingPeriod;

    if (priceId) {
      const lookup = stripeService.lookupTierFromPriceId(priceId);
      if (lookup) {
        tier = lookup.tier;
        billingPeriod = lookup.billingPeriod;
      }
    }

    // Update subscription record
    await subscriptionRepository.update(subscription.id, {
      stripeSubscriptionId,
      stripePriceId: priceId ?? undefined,
      status: mappedStatus,
      tier,
      billingPeriod: billingPeriod ?? undefined,
      currentPeriodStart: currentPeriodStart ? new Date(currentPeriodStart * 1000) : undefined,
      currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : undefined,
      cancelAtPeriodEnd,
      canceledAt: canceledAt ? new Date(canceledAt * 1000) : null,
    });

    // Sync tier to trainer profile
    const effectiveTier = mappedStatus === 'ACTIVE' || mappedStatus === 'PAST_DUE' || mappedStatus === 'TRIALING'
      ? tier
      : 'FREE';
    await subscriptionRepository.updateTrainerTier(subscription.trainerId, effectiveTier);
  },

  /**
   * Handle checkout completed — link the Stripe subscription to our record.
   */
  handleCheckoutCompleted: async (
    stripeCustomerId: string,
    stripeSubscriptionId: string
  ) => {
    const subscription = await subscriptionRepository.findByStripeCustomerId(stripeCustomerId);
    if (!subscription) {
      console.error(`No subscription found for Stripe customer ${stripeCustomerId}`);
      return;
    }

    await subscriptionRepository.update(subscription.id, {
      stripeSubscriptionId,
    });
  },

  /**
   * Handle invoice payment failed.
   */
  handlePaymentFailed: async (stripeCustomerId: string) => {
    const subscription = await subscriptionRepository.findByStripeCustomerId(stripeCustomerId);
    if (!subscription) return;

    await subscriptionRepository.update(subscription.id, {
      status: 'PAST_DUE',
    });
  },
};
