import { z } from 'zod';

/////////////////////////////////////////
// DIARY COMMENT SCHEMA
/////////////////////////////////////////

export const DiaryCommentSchema = z.object({
  id: z.string().cuid(),
  diaryEntryId: z.string(),
  userId: z.string(),
  content: z.string().min(1, { message: "Comment cannot be empty" }).max(1000, { message: "Comment must be at most 1000 characters" }),
  createdAt: z.coerce.date(),
})

export type DiaryComment = z.infer<typeof DiaryCommentSchema>

/////////////////////////////////////////
// DIARY COMMENT OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const DiaryCommentOptionalDefaultsSchema = DiaryCommentSchema.merge(z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
}))

export type DiaryCommentOptionalDefaults = z.infer<typeof DiaryCommentOptionalDefaultsSchema>

export default DiaryCommentSchema;
