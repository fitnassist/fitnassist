import { TRPCError } from '@trpc/server';
import type { ReferralStatus } from '@fitnassist/database';
import {
  REFERRAL_EXPIRY_DAYS,
  REFERRAL_REFERRED_DISCOUNT_PERCENT,
  REFERRAL_REFERRER_REWARD_PERCENT,
} from '@fitnassist/schemas';
import { referralRepository } from '../repositories/referral.repository';
import { inAppNotificationService } from './in-app-notification.service';
import { getStripe } from '../lib/stripe';
import { prisma } from '../lib/prisma';

export const referralService = {
  /**
   * Create a referral record when a new user registers with a referral code (trainer handle).
   */
  async createReferral(referrerHandle: string, referredUserId: string) {
    // Look up the referring trainer by handle
    const referrer = await prisma.trainerProfile.findUnique({
      where: { handle: referrerHandle },
      select: { id: true, userId: true, displayName: true },
    });

    if (!referrer) {
      // Silently ignore invalid referral codes — don't block registration
      console.warn(`[Referral] Invalid referral code: ${referrerHandle}`);
      return null;
    }

    // Prevent self-referral
    if (referrer.userId === referredUserId) {
      console.warn(`[Referral] Self-referral attempted by user ${referredUserId}`);
      return null;
    }

    // Check if user was already referred
    const existing = await referralRepository.findByReferredUserId(referredUserId);
    if (existing) {
      console.warn(`[Referral] User ${referredUserId} already has a referral`);
      return null;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFERRAL_EXPIRY_DAYS);

    const referral = await referralRepository.create({
      referrerId: referrer.id,
      referredUserId,
      expiresAt,
    });

    // Notify the referrer that someone signed up with their link
    const referredUser = await prisma.user.findUnique({
      where: { id: referredUserId },
      select: { name: true },
    });

    inAppNotificationService.notify({
      userId: referrer.userId,
      type: 'REFERRAL_SIGNED_UP',
      title: `${referredUser?.name ?? 'Someone'} signed up using your referral link`,
      link: '/dashboard/referrals',
    }).catch(console.error);

    return referral;
  },

  /**
   * Get referral stats for a trainer.
   */
  async getReferralStats(trainerId: string) {
    const [total, activated, pending] = await Promise.all([
      referralRepository.countByReferrer(trainerId),
      referralRepository.countByReferrer(trainerId, 'ACTIVATED'),
      referralRepository.countByReferrer(trainerId, 'PENDING'),
    ]);

    // Count how many months earned (1 per activated referral where reward was applied)
    const monthsEarned = await prisma.referral.count({
      where: {
        referrerId: trainerId,
        status: 'ACTIVATED',
        referrerRewardApplied: true,
      },
    });

    return { total, activated, pending, monthsEarned };
  },

  /**
   * Get paginated referral history for a trainer.
   */
  async getReferralHistory(
    trainerId: string,
    options: { page?: number; limit?: number; status?: ReferralStatus },
  ) {
    return referralRepository.findByReferrerId(trainerId, options);
  },

  /**
   * Called from the Stripe webhook when a referred user's first subscription payment succeeds.
   * Activates the referral and applies the referrer's reward.
   */
  async activateReferral(referredUserId: string) {
    const referral = await referralRepository.findByReferredUserId(referredUserId);
    if (!referral || referral.status !== 'PENDING') return null;

    // Check if referral has expired
    if (referral.expiresAt < new Date()) {
      await referralRepository.expirePending(referral.id);
      return null;
    }

    // Activate the referral
    await referralRepository.activate(referral.id);

    // Apply referrer reward (100% off next invoice)
    await this.applyReferrerReward(referral.id, referral.referrer.id);

    // Notify the referrer
    const referredUser = await prisma.user.findUnique({
      where: { id: referredUserId },
      select: { name: true },
    });

    inAppNotificationService.notify({
      userId: referral.referrer.userId,
      type: 'REFERRAL_ACTIVATED',
      title: `${referredUser?.name ?? 'Your referral'} just subscribed! You've earned 1 month free.`,
      link: '/dashboard/referrals',
    }).catch(console.error);

    return referral;
  },

  /**
   * Apply 100% off coupon to the referrer's next invoice.
   */
  async applyReferrerReward(referralId: string, referrerTrainerId: string) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { trainerId: referrerTrainerId },
        select: { stripeCustomerId: true, stripeSubscriptionId: true },
      });

      if (!subscription?.stripeSubscriptionId) {
        // Referrer doesn't have an active subscription yet — mark reward for later
        console.log(`[Referral] Referrer ${referrerTrainerId} has no subscription, reward pending`);
        return;
      }

      const stripe = getStripe();

      // Create a 100% off coupon (applies once)
      const coupon = await stripe.coupons.create({
        percent_off: REFERRAL_REFERRER_REWARD_PERCENT,
        duration: 'once',
        name: 'Referral Reward - 1 Month Free',
        metadata: { referralId, type: 'referral_reward' },
      });

      // Apply the coupon to the referrer's subscription
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        discounts: [{ coupon: coupon.id }],
      });

      await referralRepository.markReferrerRewarded(referralId);
    } catch (error) {
      console.error(`[Referral] Failed to apply referrer reward for ${referrerTrainerId}:`, error);
    }
  },

  /**
   * Get the referred discount coupon ID for a user's checkout session.
   * Returns a Stripe coupon ID if the user has a pending referral.
   */
  async getReferredDiscount(referredUserId: string) {
    const referral = await referralRepository.findByReferredUserId(referredUserId);
    if (!referral || referral.status !== 'PENDING' || referral.referredDiscountApplied) {
      return null;
    }

    // Check expiry
    if (referral.expiresAt < new Date()) {
      return null;
    }

    try {
      const stripe = getStripe();

      // Create a 20% off coupon for the referred user
      const coupon = await stripe.coupons.create({
        percent_off: REFERRAL_REFERRED_DISCOUNT_PERCENT,
        duration: 'once',
        name: 'Referral Discount - 20% Off First Payment',
        metadata: { referralId: referral.id, type: 'referral_discount' },
      });

      // Mark as applied so we don't create multiple coupons
      await referralRepository.markReferredDiscounted(referral.id);

      return coupon.id;
    } catch (error) {
      console.error(`[Referral] Failed to create referred discount:`, error);
      return null;
    }
  },

  /**
   * Get referrer info for the registration banner (public).
   */
  async getReferrerInfo(handle: string) {
    const trainer = await prisma.trainerProfile.findUnique({
      where: { handle },
      select: {
        displayName: true,
        profileImageUrl: true,
      },
    });

    if (!trainer) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Trainer not found',
      });
    }

    return {
      displayName: trainer.displayName,
      profileImageUrl: trainer.profileImageUrl,
    };
  },

  /**
   * Expire stale PENDING referrals past their expiresAt date.
   * Called by cron job.
   */
  async expireStaleReferrals() {
    const expired = await referralRepository.findExpiredPending();
    let count = 0;

    for (const referral of expired) {
      await referralRepository.expirePending(referral.id);
      count++;
    }

    return { expired: count };
  },
};
