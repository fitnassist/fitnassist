import { z } from 'zod';
import { ActivitySourceSchema } from '../inputTypeSchemas/ActivitySourceSchema'

/////////////////////////////////////////
// STEPS ENTRY SCHEMA
/////////////////////////////////////////

export const StepsEntrySchema = z.object({
  source: ActivitySourceSchema,
  id: z.string().cuid(),
  diaryEntryId: z.string(),
  totalSteps: z.number().int().min(0, { message: "Steps cannot be negative" }),
})

export type StepsEntry = z.infer<typeof StepsEntrySchema>

/////////////////////////////////////////
// STEPS ENTRY OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const StepsEntryOptionalDefaultsSchema = StepsEntrySchema.merge(z.object({
  source: ActivitySourceSchema.optional(),
  id: z.string().cuid().optional(),
}))

export type StepsEntryOptionalDefaults = z.infer<typeof StepsEntryOptionalDefaultsSchema>

export default StepsEntrySchema;
