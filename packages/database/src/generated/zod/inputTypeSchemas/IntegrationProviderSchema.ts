import { z } from 'zod';

export const IntegrationProviderSchema = z.enum(['STRAVA','GOOGLE_FIT','FITBIT','GARMIN','APPLE_HEALTH']);

export type IntegrationProviderType = `${z.infer<typeof IntegrationProviderSchema>}`

export default IntegrationProviderSchema;
