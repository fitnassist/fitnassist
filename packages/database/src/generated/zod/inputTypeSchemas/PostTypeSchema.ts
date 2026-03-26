import { z } from 'zod';

export const PostTypeSchema = z.enum(['UPDATE','ACHIEVEMENT','MILESTONE']);

export type PostTypeType = `${z.infer<typeof PostTypeSchema>}`

export default PostTypeSchema;
