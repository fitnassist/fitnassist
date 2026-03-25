

/////////////////////////////////////////
// WATER ENTRY SCHEMA
/////////////////////////////////////////

export const WaterEntrySchema = z.object({
  id: z.string().cuid(),
  diaryEntryId: z.string(),
  totalMl: z.number().int().min(0, { message: "Water intake cannot be negative" }),
})

export type WaterEntry = z.infer<typeof WaterEntrySchema>

/////////////////////////////////////////
// WATER ENTRY OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const WaterEntryOptionalDefaultsSchema = WaterEntrySchema.merge(z.object({
  id: z.string().cuid().optional(),
}))

export type WaterEntryOptionalDefaults = z.infer<typeof WaterEntryOptionalDefaultsSchema>

export default WaterEntrySchema;
