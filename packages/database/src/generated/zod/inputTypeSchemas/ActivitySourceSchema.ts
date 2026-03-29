import { z } from 'zod';

export const ActivitySourceSchema = z.enum(['MANUAL','STRAVA','GARMIN','APPLE_HEALTH','GOOGLE_FIT','FITBIT']);

export type ActivitySourceType = `${z.infer<typeof ActivitySourceSchema>}`

export default ActivitySourceSchema;
