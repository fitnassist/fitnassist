import { z } from 'zod';

export const CouponScalarFieldEnumSchema = z.enum(['id','trainerId','code','stripeCouponId','stripePromotionCodeId','description','percentOff','amountOffPence','minOrderPence','maxRedemptions','currentRedemptions','isActive','expiresAt','createdAt','updatedAt']);

export default CouponScalarFieldEnumSchema;
