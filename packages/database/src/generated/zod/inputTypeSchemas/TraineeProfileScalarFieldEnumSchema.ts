import { z } from 'zod';


export const TraineeProfileScalarFieldEnumSchema = z.enum(['id','userId','avatarUrl','bio','dateOfBirth','gender','heightCm','startWeightKg','goalWeightKg','unitPreference','experienceLevel','activityLevel','fitnessGoals','fitnessGoalNotes','medicalNotes','weeklyWeightGoalKg','dailyCalorieTarget','dailyProteinTargetG','dailyCarbsTargetG','dailyFatTargetG','dailyWaterTargetMl','location','isPublic','createdAt','updatedAt']);

export default TraineeProfileScalarFieldEnumSchema;
