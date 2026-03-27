import { z } from 'zod';

export const SessionPaymentScalarFieldEnumSchema = z.enum(['id','bookingId','stripePaymentIntentId','stripeChargeId','amount','platformFee','currency','status','refundAmount','refundReason','refundedAt','paidAt','createdAt','updatedAt']);

export default SessionPaymentScalarFieldEnumSchema;
