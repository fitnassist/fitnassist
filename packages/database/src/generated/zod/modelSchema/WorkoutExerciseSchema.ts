

/////////////////////////////////////////
// WORKOUT EXERCISE SCHEMA
/////////////////////////////////////////

export const WorkoutExerciseSchema = z.object({
  id: z.string().cuid(),
  workoutPlanId: z.string(),
  exerciseId: z.string(),
  sets: z.number().int().min(1).nullable(),
  reps: z.string().max(50).nullable(),
  restSeconds: z.number().int().min(0).nullable(),
  sortOrder: z.number().int(),
  notes: z.string().max(500).nullable(),
})

export type WorkoutExercise = z.infer<typeof WorkoutExerciseSchema>

/////////////////////////////////////////
// WORKOUT EXERCISE OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const WorkoutExerciseOptionalDefaultsSchema = WorkoutExerciseSchema.merge(z.object({
  id: z.string().cuid().optional(),
  sortOrder: z.number().int().optional(),
}))

export type WorkoutExerciseOptionalDefaults = z.infer<typeof WorkoutExerciseOptionalDefaultsSchema>

export default WorkoutExerciseSchema;
