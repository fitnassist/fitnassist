import { z } from 'zod';

export const SubscriptionTierSchema = z.enum(['FREE','BASIC','PRO']);

export type SubscriptionTierType = `${z.infer<typeof SubscriptionTierSchema>}`

export default SubscriptionTierSchema;
