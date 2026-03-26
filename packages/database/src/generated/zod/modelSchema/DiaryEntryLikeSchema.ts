import { z } from 'zod';

/////////////////////////////////////////
// DIARY ENTRY LIKE SCHEMA
/////////////////////////////////////////

export const DiaryEntryLikeSchema = z.object({
  id: z.string().cuid(),
  diaryEntryId: z.string(),
  userId: z.string(),
  createdAt: z.coerce.date(),
})

export type DiaryEntryLike = z.infer<typeof DiaryEntryLikeSchema>

/////////////////////////////////////////
// DIARY ENTRY LIKE OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const DiaryEntryLikeOptionalDefaultsSchema = DiaryEntryLikeSchema.merge(z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
}))

export type DiaryEntryLikeOptionalDefaults = z.infer<typeof DiaryEntryLikeOptionalDefaultsSchema>

export default DiaryEntryLikeSchema;
