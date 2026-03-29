import { z } from 'zod';

// =============================================================================
// PRODUCT SCHEMAS
// =============================================================================

export const createProductSchema = z.object({
  type: z.enum(['DIGITAL', 'PHYSICAL']),
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().optional(),
  shortDescription: z.string().max(300).optional(),
  pricePence: z.number().int().min(1, 'Price must be at least 1p'),
  compareAtPricePence: z.number().int().min(1).optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  galleryUrls: z.array(z.string()).optional(),
  digitalFileUrl: z.string().optional().nullable(),
  digitalFileName: z.string().optional().nullable(),
  stockCount: z.number().int().min(0).optional().nullable(),
  seoTitle: z.string().max(60).optional().nullable(),
  seoDescription: z.string().max(160).optional().nullable(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial().extend({
  productId: z.string(),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const publishProductSchema = z.object({
  productId: z.string(),
});

export const archiveProductSchema = z.object({
  productId: z.string(),
});

export const deleteProductSchema = z.object({
  productId: z.string(),
});

export const reorderProductsSchema = z.object({
  productIds: z.array(z.string()),
});

// =============================================================================
// COUPON SCHEMAS
// =============================================================================

export const createCouponSchema = z
  .object({
    code: z
      .string()
      .min(1, 'Coupon code is required')
      .max(50)
      .transform((v) => v.toUpperCase().replace(/\s/g, '')),
    description: z.string().optional(),
    discountType: z.enum(['PERCENT', 'FIXED']),
    percentOff: z.number().min(1).max(100).optional(),
    amountOffPence: z.number().int().min(1).optional(),
    minOrderPence: z.number().int().min(0).optional().nullable(),
    maxRedemptions: z.number().int().min(1).optional().nullable(),
    expiresAt: z.string().datetime().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.discountType === 'PERCENT') return data.percentOff != null;
      return data.amountOffPence != null;
    },
    { message: 'Discount value is required', path: ['percentOff'] },
  );

export type CreateCouponInput = z.infer<typeof createCouponSchema>;

export const updateCouponSchema = z.object({
  couponId: z.string(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  maxRedemptions: z.number().int().min(1).optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;

export const deleteCouponSchema = z.object({
  couponId: z.string(),
});

export const validateCouponSchema = z.object({
  trainerId: z.string(),
  code: z.string().min(1),
  subtotalPence: z.number().int().min(0),
});

// =============================================================================
// ORDER SCHEMAS
// =============================================================================

export const createOrderSchema = z.object({
  trainerId: z.string(),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().min(1).default(1),
    }),
  ).min(1, 'At least one item is required'),
  couponCode: z.string().optional(),
  shippingName: z.string().optional(),
  shippingAddress: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
  orderId: z.string(),
  status: z.enum(['PROCESSING', 'SHIPPED', 'DELIVERED']),
});

export const refundOrderSchema = z.object({
  orderId: z.string(),
  reason: z.string().optional(),
});
