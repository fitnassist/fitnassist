import { z } from 'zod';

/////////////////////////////////////////
// CANCELLATION POLICY SCHEMA
/////////////////////////////////////////

export const CancellationPolicySchema = z.object({
  id: z.string().cuid(),
  trainerId: z.string(),
  fullRefundHours: z.number().int().min(1).max(168),
  partialRefundHours: z.number().int().min(1).max(168),
  partialRefundPercent: z.number().int().min(0).max(100),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type CancellationPolicy = z.infer<typeof CancellationPolicySchema>

/////////////////////////////////////////
// CANCELLATION POLICY OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const CancellationPolicyOptionalDefaultsSchema = CancellationPolicySchema.merge(z.object({
  id: z.string().cuid().optional(),
  fullRefundHours: z.number().int().min(1).max(168).optional(),
  partialRefundHours: z.number().int().min(1).max(168).optional(),
  partialRefundPercent: z.number().int().min(0).max(100).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type CancellationPolicyOptionalDefaults = z.infer<typeof CancellationPolicyOptionalDefaultsSchema>

export default CancellationPolicySchema;
