import { z } from 'zod';

export const BlogPostStatusSchema = z.enum(['DRAFT','PUBLISHED','ARCHIVED']);

export type BlogPostStatusType = `${z.infer<typeof BlogPostStatusSchema>}`

export default BlogPostStatusSchema;
