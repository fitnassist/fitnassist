import { z } from 'zod';

export const ProductTypeSchema = z.enum(['DIGITAL','PHYSICAL']);

export type ProductTypeType = `${z.infer<typeof ProductTypeSchema>}`

export default ProductTypeSchema;
