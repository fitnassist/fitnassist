

export const SubscriptionTierSchema = z.enum(['FREE','BASIC','PRO','ELITE']);

export type SubscriptionTierType = `${z.infer<typeof SubscriptionTierSchema>}`

export default SubscriptionTierSchema;
