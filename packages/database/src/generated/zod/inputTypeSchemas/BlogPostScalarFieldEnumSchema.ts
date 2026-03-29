import { z } from 'zod';

export const BlogPostScalarFieldEnumSchema = z.enum(['id','websiteId','title','slug','excerpt','content','coverImageUrl','status','publishedAt','seoTitle','seoDescription','tags','createdAt','updatedAt']);

export default BlogPostScalarFieldEnumSchema;
