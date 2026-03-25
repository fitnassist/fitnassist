import { z } from 'zod';
import { MoodLevelSchema } from '../inputTypeSchemas/MoodLevelSchema'

/////////////////////////////////////////
// MOOD ENTRY SCHEMA
/////////////////////////////////////////

export const MoodEntrySchema = z.object({
  level: MoodLevelSchema,
  id: z.string().cuid(),
  diaryEntryId: z.string(),
  notes: z.string().max(500, { message: "Notes must be at most 500 characters" }).nullable(),
})

export type MoodEntry = z.infer<typeof MoodEntrySchema>

/////////////////////////////////////////
// MOOD ENTRY OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const MoodEntryOptionalDefaultsSchema = MoodEntrySchema.merge(z.object({
  id: z.string().cuid().optional(),
}))

export type MoodEntryOptionalDefaults = z.infer<typeof MoodEntryOptionalDefaultsSchema>

export default MoodEntrySchema;
