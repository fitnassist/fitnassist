import { SubscriptionStatusSchema } from '../inputTypeSchemas/SubscriptionStatusSchema'
import { SubscriptionTierSchema } from '../inputTypeSchemas/SubscriptionTierSchema'
import { BillingPeriodSchema } from '../inputTypeSchemas/BillingPeriodSchema'

/////////////////////////////////////////
// SUBSCRIPTION SCHEMA
/////////////////////////////////////////

export const SubscriptionSchema = z.object({
  status: SubscriptionStatusSchema,
  tier: SubscriptionTierSchema,
  billingPeriod: BillingPeriodSchema.nullable(),
  id: z.string().cuid(),
  trainerId: z.string(),
  stripeCustomerId: z.string(),
  stripeSubscriptionId: z.string().nullable(),
  stripePriceId: z.string().nullable(),
  trialStartDate: z.coerce.date().nullable(),
  trialEndDate: z.coerce.date().nullable(),
  currentPeriodStart: z.coerce.date().nullable(),
  currentPeriodEnd: z.coerce.date().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  canceledAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Subscription = z.infer<typeof SubscriptionSchema>

/////////////////////////////////////////
// SUBSCRIPTION OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const SubscriptionOptionalDefaultsSchema = SubscriptionSchema.merge(z.object({
  status: SubscriptionStatusSchema.optional(),
  tier: SubscriptionTierSchema.optional(),
  id: z.string().cuid().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type SubscriptionOptionalDefaults = z.infer<typeof SubscriptionOptionalDefaultsSchema>

export default SubscriptionSchema;
