

/////////////////////////////////////////
// SLEEP ENTRY SCHEMA
/////////////////////////////////////////

export const SleepEntrySchema = z.object({
  id: z.string().cuid(),
  diaryEntryId: z.string(),
  hoursSlept: z.number().min(0, { message: "Hours slept cannot be negative" }).max(24, { message: "Hours slept cannot exceed 24" }),
  quality: z.number().int().min(1, { message: "Quality must be at least 1" }).max(5, { message: "Quality must be at most 5" }),
})

export type SleepEntry = z.infer<typeof SleepEntrySchema>

/////////////////////////////////////////
// SLEEP ENTRY OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const SleepEntryOptionalDefaultsSchema = SleepEntrySchema.merge(z.object({
  id: z.string().cuid().optional(),
}))

export type SleepEntryOptionalDefaults = z.infer<typeof SleepEntryOptionalDefaultsSchema>

export default SleepEntrySchema;
