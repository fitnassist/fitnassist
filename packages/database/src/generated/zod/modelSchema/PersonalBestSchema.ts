import { z } from 'zod';
import { PersonalBestCategorySchema } from '../inputTypeSchemas/PersonalBestCategorySchema'
import { ActivityTypeSchema } from '../inputTypeSchemas/ActivityTypeSchema'

/////////////////////////////////////////
// PERSONAL BEST SCHEMA
/////////////////////////////////////////

export const PersonalBestSchema = z.object({
  category: PersonalBestCategorySchema,
  activityType: ActivityTypeSchema.nullable(),
  id: z.string().cuid(),
  userId: z.string(),
  distanceKm: z.number().nullable(),
  value: z.number(),
  unit: z.string(),
  label: z.string().max(200),
  achievedAt: z.coerce.date(),
  previousValue: z.number().nullable(),
  previousDate: z.coerce.date().nullable(),
  diaryEntryId: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type PersonalBest = z.infer<typeof PersonalBestSchema>

/////////////////////////////////////////
// PERSONAL BEST OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const PersonalBestOptionalDefaultsSchema = PersonalBestSchema.merge(z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type PersonalBestOptionalDefaults = z.infer<typeof PersonalBestOptionalDefaultsSchema>

export default PersonalBestSchema;
