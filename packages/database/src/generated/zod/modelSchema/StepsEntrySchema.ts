import { z } from 'zod';


/////////////////////////////////////////
// STEPS ENTRY SCHEMA
/////////////////////////////////////////

export const StepsEntrySchema = z.object({
  id: z.string().cuid(),
  diaryEntryId: z.string(),
  totalSteps: z.number().int().min(0, { message: "Steps cannot be negative" }),
})

export type StepsEntry = z.infer<typeof StepsEntrySchema>

/////////////////////////////////////////
// STEPS ENTRY OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const StepsEntryOptionalDefaultsSchema = StepsEntrySchema.merge(z.object({
  id: z.string().cuid().optional(),
}))

export type StepsEntryOptionalDefaults = z.infer<typeof StepsEntryOptionalDefaultsSchema>

export default StepsEntrySchema;
