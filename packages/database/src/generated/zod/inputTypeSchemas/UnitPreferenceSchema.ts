

export const UnitPreferenceSchema = z.enum(['METRIC','IMPERIAL']);

export type UnitPreferenceType = `${z.infer<typeof UnitPreferenceSchema>}`

export default UnitPreferenceSchema;
