

/////////////////////////////////////////
// NEWSLETTER SUBSCRIPTION SCHEMA
/////////////////////////////////////////

export const NewsletterSubscriptionSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email({ message: "Please enter a valid email address" }),
  createdAt: z.coerce.date(),
})

export type NewsletterSubscription = z.infer<typeof NewsletterSubscriptionSchema>

/////////////////////////////////////////
// NEWSLETTER SUBSCRIPTION OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const NewsletterSubscriptionOptionalDefaultsSchema = NewsletterSubscriptionSchema.merge(z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
}))

export type NewsletterSubscriptionOptionalDefaults = z.infer<typeof NewsletterSubscriptionOptionalDefaultsSchema>

export default NewsletterSubscriptionSchema;
