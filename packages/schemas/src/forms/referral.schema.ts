import { z } from 'zod';

export const referralHistoryInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
  status: z.enum(['PENDING', 'ACTIVATED', 'EXPIRED']).optional(),
});

export type ReferralHistoryInput = z.infer<typeof referralHistoryInputSchema>;

export const referrerInfoInputSchema = z.object({
  handle: z.string().min(1),
});

export type ReferrerInfoInput = z.infer<typeof referrerInfoInputSchema>;

export const REFERRAL_EXPIRY_DAYS = 90;
export const REFERRAL_REFERRED_DISCOUNT_PERCENT = 20;
export const REFERRAL_REFERRER_REWARD_PERCENT = 100;
