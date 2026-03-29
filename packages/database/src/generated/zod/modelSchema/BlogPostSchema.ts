import { z } from 'zod';
import { BlogPostStatusSchema } from '../inputTypeSchemas/BlogPostStatusSchema'

/////////////////////////////////////////
// BLOG POST SCHEMA
/////////////////////////////////////////

export const BlogPostSchema = z.object({
  status: BlogPostStatusSchema,
  id: z.string().cuid(),
  websiteId: z.string(),
  title: z.string().min(1, { message: "Title is required" }).max(200, { message: "Title must be at most 200 characters" }),
  slug: z.string().min(1, { message: "Slug is required" }).max(200, { message: "Slug must be at most 200 characters" }),
  excerpt: z.string().max(300, { message: "Excerpt must be at most 300 characters" }).nullable(),
  content: z.string(),
  coverImageUrl: z.string().url({ message: "Must be a valid URL" }).nullable(),
  publishedAt: z.coerce.date().nullable(),
  seoTitle: z.string().max(60, { message: "SEO title must be at most 60 characters" }).nullable(),
  seoDescription: z.string().max(160, { message: "SEO description must be at most 160 characters" }).nullable(),
  tags: z.string().array(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type BlogPost = z.infer<typeof BlogPostSchema>

/////////////////////////////////////////
// BLOG POST OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const BlogPostOptionalDefaultsSchema = BlogPostSchema.merge(z.object({
  status: BlogPostStatusSchema.optional(),
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type BlogPostOptionalDefaults = z.infer<typeof BlogPostOptionalDefaultsSchema>

export default BlogPostSchema;
