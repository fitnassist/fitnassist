import { z } from 'zod';

// =============================================================================
// SUPPORT CONTACT FORM SCHEMAS
// =============================================================================

export const supportContactSchema = z.object({
  name: z.string().min(1, 'Please enter your name').max(100, 'Name is too long'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(1, 'Please select a subject'),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be under 2000 characters'),
});

export type SupportContactInput = z.infer<typeof supportContactSchema>;
