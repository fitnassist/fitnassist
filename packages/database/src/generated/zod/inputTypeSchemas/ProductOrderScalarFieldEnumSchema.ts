import { z } from 'zod';

export const ProductOrderScalarFieldEnumSchema = z.enum(['id','buyerUserId','trainerId','stripePaymentIntentId','stripeChargeId','status','subtotalPence','discountPence','totalPence','platformFeePence','currency','couponId','couponCode','shippingName','shippingAddress','refundAmount','refundReason','refundedAt','paidAt','createdAt','updatedAt']);

export default ProductOrderScalarFieldEnumSchema;
