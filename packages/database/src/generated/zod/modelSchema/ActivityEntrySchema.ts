import { z } from 'zod';
import { ActivityTypeSchema } from '../inputTypeSchemas/ActivityTypeSchema'
import { ActivitySourceSchema } from '../inputTypeSchemas/ActivitySourceSchema'

/////////////////////////////////////////
// ACTIVITY ENTRY SCHEMA
/////////////////////////////////////////

export const ActivityEntrySchema = z.object({
  activityType: ActivityTypeSchema,
  source: ActivitySourceSchema,
  id: z.string().cuid(),
  diaryEntryId: z.string(),
  distanceKm: z.number().min(0).nullable(),
  durationSeconds: z.number().int().min(1),
  avgPaceSecPerKm: z.number().int().nullable(),
  elevationGainM: z.number().min(0).nullable(),
  caloriesBurned: z.number().int().min(0).nullable(),
  notes: z.string().max(500).nullable(),
  activityName: z.string().max(100).nullable(),
  routePolyline: z.string().nullable(),
  startLatitude: z.number().nullable(),
  startLongitude: z.number().nullable(),
  endLatitude: z.number().nullable(),
  endLongitude: z.number().nullable(),
  avgHeartRate: z.number().int().nullable(),
  maxHeartRate: z.number().int().nullable(),
  externalId: z.string().nullable(),
})

export type ActivityEntry = z.infer<typeof ActivityEntrySchema>

/////////////////////////////////////////
// ACTIVITY ENTRY OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const ActivityEntryOptionalDefaultsSchema = ActivityEntrySchema.merge(z.object({
  source: ActivitySourceSchema.optional(),
  id: z.string().cuid().optional(),
}))

export type ActivityEntryOptionalDefaults = z.infer<typeof ActivityEntryOptionalDefaultsSchema>

export default ActivityEntrySchema;
