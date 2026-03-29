import { TRPCError } from '@trpc/server';
import { getStripe } from '../lib/stripe';
import { couponRepository } from '../repositories/coupon.repository';
import { prisma } from '../lib/prisma';

const getTrainerStripeAccount = async (trainerId: string) => {
  const trainer = await prisma.trainerProfile.findUnique({
    where: { id: trainerId },
    select: { stripeConnectedAccountId: true, stripeOnboardingComplete: true, paymentsEnabled: true },
  });
  if (!trainer?.paymentsEnabled || !trainer.stripeConnectedAccountId || !trainer.stripeOnboardingComplete) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Stripe payments are not enabled. Complete Stripe onboarding first.' });
  }
  return trainer.stripeConnectedAccountId;
};

export const couponService = {
  async getCoupons(trainerId: string) {
    return couponRepository.findByTrainerId(trainerId);
  },

  async createCoupon(trainerId: string, data: {
    code: string;
    description?: string;
    discountType: 'PERCENT' | 'FIXED';
    percentOff?: number;
    amountOffPence?: number;
    minOrderPence?: number | null;
    maxRedemptions?: number | null;
    expiresAt?: string | null;
  }) {
    const stripe = getStripe();
    const stripeAccountId = await getTrainerStripeAccount(trainerId);

    // Check code uniqueness locally
    const existing = await couponRepository.findByCode(trainerId, data.code);
    if (existing) {
      throw new TRPCError({ code: 'CONFLICT', message: 'A coupon with this code already exists' });
    }

    // Create Stripe coupon on trainer's connected account
    const stripeCoupon = await stripe.coupons.create(
      {
        ...(data.discountType === 'PERCENT'
          ? { percent_off: data.percentOff! }
          : { amount_off: data.amountOffPence!, currency: 'gbp' }),
        ...(data.expiresAt ? { redeem_by: Math.floor(new Date(data.expiresAt).getTime() / 1000) } : {}),
        ...(data.maxRedemptions ? { max_redemptions: data.maxRedemptions } : {}),
      },
      { stripeAccount: stripeAccountId },
    );

    // Create Stripe promotion code (the user-facing code)
    const promoCode = await stripe.promotionCodes.create(
      {
        promotion: { type: 'coupon', coupon: stripeCoupon.id },
        code: data.code,
        ...(data.maxRedemptions ? { max_redemptions: data.maxRedemptions } : {}),
        ...(data.expiresAt ? { expires_at: Math.floor(new Date(data.expiresAt).getTime() / 1000) } : {}),
        ...(data.minOrderPence ? { restrictions: { minimum_amount: data.minOrderPence, minimum_amount_currency: 'gbp' } } : {}),
      },
      { stripeAccount: stripeAccountId },
    );

    // Store in our DB
    return couponRepository.create({
      trainerId,
      code: data.code,
      stripeCouponId: stripeCoupon.id,
      stripePromotionCodeId: promoCode.id,
      description: data.description,
      percentOff: data.percentOff,
      amountOffPence: data.amountOffPence,
      minOrderPence: data.minOrderPence ?? undefined,
      maxRedemptions: data.maxRedemptions ?? undefined,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    });
  },

  async updateCoupon(trainerId: string, couponId: string, data: {
    description?: string;
    isActive?: boolean;
    maxRedemptions?: number | null;
    expiresAt?: string | null;
  }) {
    const coupon = await couponRepository.findById(couponId);
    if (!coupon || coupon.trainerId !== trainerId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Coupon not found' });
    }

    // If toggling active state, update Stripe promotion code
    if (data.isActive !== undefined && data.isActive !== coupon.isActive && coupon.stripePromotionCodeId) {
      const stripe = getStripe();
      const stripeAccountId = await getTrainerStripeAccount(trainerId);
      await stripe.promotionCodes.update(
        coupon.stripePromotionCodeId,
        { active: data.isActive },
        { stripeAccount: stripeAccountId },
      );
    }

    return couponRepository.update(couponId, {
      description: data.description,
      isActive: data.isActive,
      maxRedemptions: data.maxRedemptions,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : data.expiresAt === null ? null : undefined,
    });
  },

  async deleteCoupon(trainerId: string, couponId: string) {
    const coupon = await couponRepository.findById(couponId);
    if (!coupon || coupon.trainerId !== trainerId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Coupon not found' });
    }

    // Deactivate on Stripe
    if (coupon.stripePromotionCodeId) {
      const stripe = getStripe();
      const stripeAccountId = await getTrainerStripeAccount(trainerId);
      await stripe.promotionCodes.update(
        coupon.stripePromotionCodeId,
        { active: false },
        { stripeAccount: stripeAccountId },
      );
    }

    // Soft delete locally
    return couponRepository.delete(couponId);
  },

  async validateCoupon(trainerId: string, code: string, subtotalPence: number) {
    const coupon = await couponRepository.findByCode(trainerId, code);
    if (!coupon) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid coupon code' });
    }

    if (!coupon.isActive) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'This coupon is no longer active' });
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'This coupon has expired' });
    }

    if (coupon.maxRedemptions && coupon.currentRedemptions >= coupon.maxRedemptions) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'This coupon has reached its usage limit' });
    }

    if (coupon.minOrderPence && subtotalPence < coupon.minOrderPence) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Minimum order of £${(coupon.minOrderPence / 100).toFixed(2)} required`,
      });
    }

    // Calculate discount
    let discountPence: number;
    if (coupon.percentOff) {
      discountPence = Math.round(subtotalPence * (coupon.percentOff / 100));
    } else {
      discountPence = Math.min(coupon.amountOffPence ?? 0, subtotalPence);
    }

    return {
      couponId: coupon.id,
      code: coupon.code,
      percentOff: coupon.percentOff,
      amountOffPence: coupon.amountOffPence,
      discountPence,
      totalAfterDiscount: subtotalPence - discountPence,
    };
  },
};
