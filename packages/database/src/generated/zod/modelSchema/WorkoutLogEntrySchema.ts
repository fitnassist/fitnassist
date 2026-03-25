

/////////////////////////////////////////
// WORKOUT LOG ENTRY SCHEMA
/////////////////////////////////////////

export const WorkoutLogEntrySchema = z.object({
  id: z.string().cuid(),
  diaryEntryId: z.string(),
  workoutPlanId: z.string().nullable(),
  workoutPlanName: z.string().nullable(),
  durationMinutes: z.number().int().min(1, { message: "Duration must be at least 1 minute" }),
  caloriesBurned: z.number().int().min(0, { message: "Calories burned cannot be negative" }).nullable(),
  notes: z.string().max(500, { message: "Notes must be at most 500 characters" }).nullable(),
})

export type WorkoutLogEntry = z.infer<typeof WorkoutLogEntrySchema>

/////////////////////////////////////////
// WORKOUT LOG ENTRY OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const WorkoutLogEntryOptionalDefaultsSchema = WorkoutLogEntrySchema.merge(z.object({
  id: z.string().cuid().optional(),
}))

export type WorkoutLogEntryOptionalDefaults = z.infer<typeof WorkoutLogEntryOptionalDefaultsSchema>

export default WorkoutLogEntrySchema;
