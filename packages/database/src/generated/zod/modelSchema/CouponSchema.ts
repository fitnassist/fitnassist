import { z } from 'zod';

/////////////////////////////////////////
// COUPON SCHEMA
/////////////////////////////////////////

export const CouponSchema = z.object({
  id: z.string().cuid(),
  trainerId: z.string(),
  code: z.string().min(1, { message: "Coupon code is required" }).max(50, { message: "Coupon code must be at most 50 characters" }),
  stripeCouponId: z.string(),
  stripePromotionCodeId: z.string().nullable(),
  description: z.string().nullable(),
  percentOff: z.number().nullable(),
  amountOffPence: z.number().int().nullable(),
  minOrderPence: z.number().int().nullable(),
  maxRedemptions: z.number().int().nullable(),
  currentRedemptions: z.number().int(),
  isActive: z.boolean(),
  expiresAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Coupon = z.infer<typeof CouponSchema>

/////////////////////////////////////////
// COUPON OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const CouponOptionalDefaultsSchema = CouponSchema.merge(z.object({
  id: z.string().cuid().optional(),
  currentRedemptions: z.number().int().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type CouponOptionalDefaults = z.infer<typeof CouponOptionalDefaultsSchema>

export default CouponSchema;
