import { z } from 'zod';

export const PersonalBestScalarFieldEnumSchema = z.enum(['id','userId','category','activityType','distanceKm','value','unit','label','achievedAt','previousValue','previousDate','diaryEntryId','createdAt','updatedAt']);

export default PersonalBestScalarFieldEnumSchema;
