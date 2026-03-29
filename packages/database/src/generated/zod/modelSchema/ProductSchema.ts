import { z } from 'zod';
import { ProductTypeSchema } from '../inputTypeSchemas/ProductTypeSchema'
import { ProductStatusSchema } from '../inputTypeSchemas/ProductStatusSchema'

/////////////////////////////////////////
// PRODUCT SCHEMA
/////////////////////////////////////////

export const ProductSchema = z.object({
  type: ProductTypeSchema,
  status: ProductStatusSchema,
  id: z.string().cuid(),
  trainerId: z.string(),
  name: z.string().min(1, { message: "Product name is required" }).max(200, { message: "Product name must be at most 200 characters" }),
  slug: z.string().min(1, { message: "Slug is required" }).max(200, { message: "Slug must be at most 200 characters" }),
  description: z.string().nullable(),
  shortDescription: z.string().max(300, { message: "Short description must be at most 300 characters" }).nullable(),
  pricePence: z.number().int().min(1, { message: "Price must be at least 1p" }),
  currency: z.string(),
  compareAtPricePence: z.number().int().nullable(),
  imageUrl: z.string().nullable(),
  galleryUrls: z.string().array(),
  digitalFileUrl: z.string().nullable(),
  digitalFileName: z.string().nullable(),
  stockCount: z.number().int().nullable(),
  seoTitle: z.string().max(60, { message: "SEO title must be at most 60 characters" }).nullable(),
  seoDescription: z.string().max(160, { message: "SEO description must be at most 160 characters" }).nullable(),
  sortOrder: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Product = z.infer<typeof ProductSchema>

/////////////////////////////////////////
// PRODUCT OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const ProductOptionalDefaultsSchema = ProductSchema.merge(z.object({
  status: ProductStatusSchema.optional(),
  id: z.string().cuid().optional(),
  currency: z.string().optional(),
  sortOrder: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type ProductOptionalDefaults = z.infer<typeof ProductOptionalDefaultsSchema>

export default ProductSchema;
