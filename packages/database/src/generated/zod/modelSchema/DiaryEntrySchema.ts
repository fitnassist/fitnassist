import { DiaryEntryTypeSchema } from '../inputTypeSchemas/DiaryEntryTypeSchema'

/////////////////////////////////////////
// DIARY ENTRY SCHEMA
/////////////////////////////////////////

export const DiaryEntrySchema = z.object({
  type: DiaryEntryTypeSchema,
  id: z.string().cuid(),
  userId: z.string(),
  date: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type DiaryEntry = z.infer<typeof DiaryEntrySchema>

/////////////////////////////////////////
// DIARY ENTRY OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const DiaryEntryOptionalDefaultsSchema = DiaryEntrySchema.merge(z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type DiaryEntryOptionalDefaults = z.infer<typeof DiaryEntryOptionalDefaultsSchema>

export default DiaryEntrySchema;
