import { z } from 'zod';
import { OrderStatusSchema } from '../inputTypeSchemas/OrderStatusSchema'

/////////////////////////////////////////
// PRODUCT ORDER SCHEMA
/////////////////////////////////////////

export const ProductOrderSchema = z.object({
  status: OrderStatusSchema,
  id: z.string().cuid(),
  buyerUserId: z.string(),
  trainerId: z.string(),
  stripePaymentIntentId: z.string().nullable(),
  stripeChargeId: z.string().nullable(),
  subtotalPence: z.number().int(),
  discountPence: z.number().int(),
  totalPence: z.number().int(),
  platformFeePence: z.number().int(),
  currency: z.string(),
  couponId: z.string().nullable(),
  couponCode: z.string().nullable(),
  shippingName: z.string().nullable(),
  shippingAddress: z.string().nullable(),
  refundAmount: z.number().int().nullable(),
  refundReason: z.string().nullable(),
  refundedAt: z.coerce.date().nullable(),
  paidAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type ProductOrder = z.infer<typeof ProductOrderSchema>

/////////////////////////////////////////
// PRODUCT ORDER OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const ProductOrderOptionalDefaultsSchema = ProductOrderSchema.merge(z.object({
  status: OrderStatusSchema.optional(),
  id: z.string().cuid().optional(),
  discountPence: z.number().int().optional(),
  currency: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type ProductOrderOptionalDefaults = z.infer<typeof ProductOrderOptionalDefaultsSchema>

export default ProductOrderSchema;
