import { z } from 'zod';

/////////////////////////////////////////
// ORDER ITEM SCHEMA
/////////////////////////////////////////

export const OrderItemSchema = z.object({
  id: z.string().cuid(),
  orderId: z.string(),
  productId: z.string(),
  productName: z.string(),
  pricePence: z.number().int().min(1, { message: "Price must be at least 1p" }),
  quantity: z.number().int(),
})

export type OrderItem = z.infer<typeof OrderItemSchema>

/////////////////////////////////////////
// ORDER ITEM OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const OrderItemOptionalDefaultsSchema = OrderItemSchema.merge(z.object({
  id: z.string().cuid().optional(),
  quantity: z.number().int().optional(),
}))

export type OrderItemOptionalDefaults = z.infer<typeof OrderItemOptionalDefaultsSchema>

export default OrderItemSchema;
