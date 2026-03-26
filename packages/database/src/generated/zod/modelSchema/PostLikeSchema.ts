import { z } from 'zod';

/////////////////////////////////////////
// POST LIKE SCHEMA
/////////////////////////////////////////

export const PostLikeSchema = z.object({
  id: z.string().cuid(),
  postId: z.string(),
  userId: z.string(),
  createdAt: z.coerce.date(),
})

export type PostLike = z.infer<typeof PostLikeSchema>

/////////////////////////////////////////
// POST LIKE OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const PostLikeOptionalDefaultsSchema = PostLikeSchema.merge(z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
}))

export type PostLikeOptionalDefaults = z.infer<typeof PostLikeOptionalDefaultsSchema>

export default PostLikeSchema;
