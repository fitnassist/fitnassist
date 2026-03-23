import { z } from 'zod';

// =============================================================================
// CONTACT REQUEST SCHEMAS
// =============================================================================

export const callbackRequestSchema = z.object({
  trainerId: z.string().cuid(),
  phone: z
    .string()
    .min(10, 'Please enter a valid phone number')
    .max(20),
  message: z.string().max(500, 'Message must be at most 500 characters').optional(),
});

export type CallbackRequestInput = z.infer<typeof callbackRequestSchema>;

export const connectionRequestSchema = z.object({
  trainerId: z.string().cuid(),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be at most 2000 characters'),
});

export type ConnectionRequestInput = z.infer<typeof connectionRequestSchema>;

// =============================================================================
// MESSAGE SCHEMAS
// =============================================================================

export const sendMessageSchema = z.object({
  connectionId: z.string().cuid(),
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message must be at most 5000 characters'),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
