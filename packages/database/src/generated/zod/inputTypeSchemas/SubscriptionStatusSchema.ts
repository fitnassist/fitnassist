

export const SubscriptionStatusSchema = z.enum(['TRIALING','ACTIVE','PAST_DUE','CANCELED','UNPAID','INCOMPLETE']);

export type SubscriptionStatusType = `${z.infer<typeof SubscriptionStatusSchema>}`

export default SubscriptionStatusSchema;
