import { z } from 'zod';

export const WorkoutExerciseScalarFieldEnumSchema = z.enum(['id','workoutPlanId','exerciseId','sets','reps','restSeconds','targetWeight','weightUnit','targetDuration','sortOrder','notes']);

export default WorkoutExerciseScalarFieldEnumSchema;
