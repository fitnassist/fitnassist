import { z } from 'zod';


/////////////////////////////////////////
// MEASUREMENT ENTRY SCHEMA
/////////////////////////////////////////

export const MeasurementEntrySchema = z.object({
  id: z.string().cuid(),
  diaryEntryId: z.string(),
  chestCm: z.number().min(0).nullable(),
  waistCm: z.number().min(0).nullable(),
  hipsCm: z.number().min(0).nullable(),
  bicepCm: z.number().min(0).nullable(),
  thighCm: z.number().min(0).nullable(),
  calfCm: z.number().min(0).nullable(),
  neckCm: z.number().min(0).nullable(),
})

export type MeasurementEntry = z.infer<typeof MeasurementEntrySchema>

/////////////////////////////////////////
// MEASUREMENT ENTRY OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const MeasurementEntryOptionalDefaultsSchema = MeasurementEntrySchema.merge(z.object({
  id: z.string().cuid().optional(),
}))

export type MeasurementEntryOptionalDefaults = z.infer<typeof MeasurementEntryOptionalDefaultsSchema>

export default MeasurementEntrySchema;
