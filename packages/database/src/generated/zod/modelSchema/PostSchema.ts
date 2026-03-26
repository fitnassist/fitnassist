import { z } from 'zod';
import { PostTypeSchema } from '../inputTypeSchemas/PostTypeSchema'
import { VisibilitySchema } from '../inputTypeSchemas/VisibilitySchema'

/////////////////////////////////////////
// POST SCHEMA
/////////////////////////////////////////

export const PostSchema = z.object({
  type: PostTypeSchema,
  visibility: VisibilitySchema,
  id: z.string().cuid(),
  userId: z.string(),
  content: z.string().min(1, { message: "Post content is required" }).max(5000, { message: "Post content must be 5000 characters or less" }),
  imageUrl: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Post = z.infer<typeof PostSchema>

/////////////////////////////////////////
// POST OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const PostOptionalDefaultsSchema = PostSchema.merge(z.object({
  type: PostTypeSchema.optional(),
  visibility: VisibilitySchema.optional(),
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type PostOptionalDefaults = z.infer<typeof PostOptionalDefaultsSchema>

export default PostSchema;
