import { z } from 'zod';

/////////////////////////////////////////
// TRAVEL TIME CACHE SCHEMA
/////////////////////////////////////////

export const TravelTimeCacheSchema = z.object({
  id: z.string().cuid(),
  originLat: z.number(),
  originLng: z.number(),
  destLat: z.number(),
  destLng: z.number(),
  durationSeconds: z.number().int(),
  distanceMeters: z.number().int(),
  fetchedAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
})

export type TravelTimeCache = z.infer<typeof TravelTimeCacheSchema>

/////////////////////////////////////////
// TRAVEL TIME CACHE OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const TravelTimeCacheOptionalDefaultsSchema = TravelTimeCacheSchema.merge(z.object({
  id: z.string().cuid().optional(),
  fetchedAt: z.coerce.date().optional(),
}))

export type TravelTimeCacheOptionalDefaults = z.infer<typeof TravelTimeCacheOptionalDefaultsSchema>

export default TravelTimeCacheSchema;
