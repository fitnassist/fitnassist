import { z } from 'zod';

export const OrderStatusSchema = z.enum(['PENDING_PAYMENT','PAID','PROCESSING','SHIPPED','DELIVERED','REFUNDED','CANCELLED']);

export type OrderStatusType = `${z.infer<typeof OrderStatusSchema>}`

export default OrderStatusSchema;
