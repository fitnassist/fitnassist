import { z } from 'zod';

// =============================================================================
// NEWSLETTER SCHEMAS
// =============================================================================

export const newsletterSignupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export type NewsletterSignupInput = z.infer<typeof newsletterSignupSchema>;
