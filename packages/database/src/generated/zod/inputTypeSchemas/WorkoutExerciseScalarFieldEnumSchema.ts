import { z } from 'zod';


export const WorkoutExerciseScalarFieldEnumSchema = z.enum(['id','workoutPlanId','exerciseId','sets','reps','restSeconds','sortOrder','notes']);

export default WorkoutExerciseScalarFieldEnumSchema;
