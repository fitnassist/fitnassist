import { z } from 'zod';

export const TraineeProfileScalarFieldEnumSchema = z.enum(['id','userId','handle','avatarUrl','bio','dateOfBirth','gender','heightCm','startWeightKg','goalWeightKg','unitPreference','experienceLevel','activityLevel','fitnessGoals','fitnessGoalNotes','medicalNotes','weeklyWeightGoalKg','dailyCalorieTarget','dailyProteinTargetG','dailyCarbsTargetG','dailyFatTargetG','dailyWaterTargetMl','addressLine1','addressLine2','city','county','postcode','country','placeId','latitude','longitude','location','privacyBio','privacyLocation','privacyBodyMetrics','privacyGoals','privacyPersonalBests','privacyProgressPhotos','privacyStats','privacyTrendWeight','privacyTrendMeasurements','privacyTrendNutrition','privacyTrendWater','privacyTrendMood','privacyTrendSleep','privacyTrendActivity','privacyTrendSteps','createdAt','updatedAt']);

export default TraineeProfileScalarFieldEnumSchema;
