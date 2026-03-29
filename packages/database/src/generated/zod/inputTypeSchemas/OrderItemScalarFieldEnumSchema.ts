import { z } from 'zod';

export const OrderItemScalarFieldEnumSchema = z.enum(['id','orderId','productId','productName','pricePence','quantity']);

export default OrderItemScalarFieldEnumSchema;
