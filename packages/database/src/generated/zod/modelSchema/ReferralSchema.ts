import { z } from 'zod';
import { ReferralStatusSchema } from '../inputTypeSchemas/ReferralStatusSchema'

/////////////////////////////////////////
// REFERRAL SCHEMA
/////////////////////////////////////////

export const ReferralSchema = z.object({
  status: ReferralStatusSchema,
  id: z.string().cuid(),
  referrerId: z.string(),
  referredUserId: z.string(),
  referrerRewardApplied: z.boolean(),
  referredDiscountApplied: z.boolean(),
  activatedAt: z.coerce.date().nullable(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Referral = z.infer<typeof ReferralSchema>

/////////////////////////////////////////
// REFERRAL OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const ReferralOptionalDefaultsSchema = ReferralSchema.merge(z.object({
  status: ReferralStatusSchema.optional(),
  id: z.string().cuid().optional(),
  referrerRewardApplied: z.boolean().optional(),
  referredDiscountApplied: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type ReferralOptionalDefaults = z.infer<typeof ReferralOptionalDefaultsSchema>

export default ReferralSchema;
