import { z } from 'zod';

export const ActivityEntryScalarFieldEnumSchema = z.enum(['id','diaryEntryId','activityType','distanceKm','durationSeconds','avgPaceSecPerKm','elevationGainM','caloriesBurned','notes','source','activityName','routePolyline','startLatitude','startLongitude','endLatitude','endLongitude','avgHeartRate','maxHeartRate','externalId']);

export default ActivityEntryScalarFieldEnumSchema;
