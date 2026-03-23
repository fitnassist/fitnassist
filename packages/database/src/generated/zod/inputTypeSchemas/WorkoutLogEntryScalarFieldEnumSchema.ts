import { z } from 'zod';

export const WorkoutLogEntryScalarFieldEnumSchema = z.enum(['id','diaryEntryId','workoutPlanId','workoutPlanName','durationMinutes','caloriesBurned','notes']);

export default WorkoutLogEntryScalarFieldEnumSchema;
