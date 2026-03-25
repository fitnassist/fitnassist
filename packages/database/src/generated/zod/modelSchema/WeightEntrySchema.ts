import { z } from 'zod';

/////////////////////////////////////////
// WEIGHT ENTRY SCHEMA
/////////////////////////////////////////

export const WeightEntrySchema = z.object({
  id: z.string().cuid(),
  diaryEntryId: z.string(),
  weightKg: z.number().positive({ message: "Weight must be a positive number" }),
})

export type WeightEntry = z.infer<typeof WeightEntrySchema>

/////////////////////////////////////////
// WEIGHT ENTRY OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const WeightEntryOptionalDefaultsSchema = WeightEntrySchema.merge(z.object({
  id: z.string().cuid().optional(),
}))

export type WeightEntryOptionalDefaults = z.infer<typeof WeightEntryOptionalDefaultsSchema>

export default WeightEntrySchema;
