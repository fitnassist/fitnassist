

export const DayOfWeekSchema = z.enum(['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY']);

export type DayOfWeekType = `${z.infer<typeof DayOfWeekSchema>}`

export default DayOfWeekSchema;
