import { z } from 'zod';


export const TravelTimeCacheScalarFieldEnumSchema = z.enum(['id','originLat','originLng','destLat','destLng','durationSeconds','distanceMeters','fetchedAt','expiresAt']);

export default TravelTimeCacheScalarFieldEnumSchema;
