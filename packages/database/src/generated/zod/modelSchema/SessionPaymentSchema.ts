import { z } from 'zod';
import { PaymentStatusSchema } from '../inputTypeSchemas/PaymentStatusSchema'

/////////////////////////////////////////
// SESSION PAYMENT SCHEMA
/////////////////////////////////////////

export const SessionPaymentSchema = z.object({
  status: PaymentStatusSchema,
  id: z.string().cuid(),
  bookingId: z.string(),
  stripePaymentIntentId: z.string(),
  stripeChargeId: z.string().nullable(),
  amount: z.number().int(),
  platformFee: z.number().int(),
  currency: z.string(),
  refundAmount: z.number().int().nullable(),
  refundReason: z.string().max(500).nullable(),
  refundedAt: z.coerce.date().nullable(),
  paidAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type SessionPayment = z.infer<typeof SessionPaymentSchema>

/////////////////////////////////////////
// SESSION PAYMENT OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const SessionPaymentOptionalDefaultsSchema = SessionPaymentSchema.merge(z.object({
  status: PaymentStatusSchema.optional(),
  id: z.string().cuid().optional(),
  platformFee: z.number().int().optional(),
  currency: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type SessionPaymentOptionalDefaults = z.infer<typeof SessionPaymentOptionalDefaultsSchema>

export default SessionPaymentSchema;
