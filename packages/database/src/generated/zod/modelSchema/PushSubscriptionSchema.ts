import { z } from 'zod';

/////////////////////////////////////////
// PUSH SUBSCRIPTION SCHEMA
/////////////////////////////////////////

export const PushSubscriptionSchema = z.object({
  id: z.string().cuid(),
  userId: z.string(),
  endpoint: z.string(),
  p256dh: z.string(),
  auth: z.string(),
  createdAt: z.coerce.date(),
})

export type PushSubscription = z.infer<typeof PushSubscriptionSchema>

/////////////////////////////////////////
// PUSH SUBSCRIPTION OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const PushSubscriptionOptionalDefaultsSchema = PushSubscriptionSchema.merge(z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
}))

export type PushSubscriptionOptionalDefaults = z.infer<typeof PushSubscriptionOptionalDefaultsSchema>

export default PushSubscriptionSchema;
