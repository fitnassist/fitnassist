import { z } from 'zod';

export const updateSessionPriceSchema = z.object({
  amount: z.number().int().min(100, 'Minimum price is £1.00').max(100000, 'Maximum price is £1,000.00'),
  currency: z.string().default('gbp'),
});

export type UpdateSessionPriceInput = z.infer<typeof updateSessionPriceSchema>;

export const updateCancellationPolicySchema = z.object({
  fullRefundHours: z.number().int().min(0).max(168),
  partialRefundHours: z.number().int().min(0).max(168),
  partialRefundPercent: z.number().int().min(0).max(100),
});

export type UpdateCancellationPolicyInput = z.infer<typeof updateCancellationPolicySchema>;

export const updatePaymentSettingsSchema = z.object({
  paymentsEnabled: z.boolean().optional(),
  firstSessionFree: z.boolean().optional(),
});

export type UpdatePaymentSettingsInput = z.infer<typeof updatePaymentSettingsSchema>;
