import { z } from 'zod';

export const ProductScalarFieldEnumSchema = z.enum(['id','trainerId','type','status','name','slug','description','shortDescription','pricePence','currency','compareAtPricePence','imageUrl','galleryUrls','digitalFileUrl','digitalFileName','stockCount','seoTitle','seoDescription','sortOrder','createdAt','updatedAt']);

export default ProductScalarFieldEnumSchema;
