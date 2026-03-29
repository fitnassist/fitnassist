import { z } from 'zod';

export const disconnectIntegrationSchema = z.object({
  provider: z.enum(['STRAVA', 'GOOGLE_FIT', 'FITBIT', 'GARMIN']),
});
export type DisconnectIntegrationInput = z.infer<typeof disconnectIntegrationSchema>;

export const updateSyncPreferencesSchema = z.object({
  provider: z.enum(['STRAVA', 'GOOGLE_FIT', 'FITBIT', 'GARMIN']),
  preferences: z.object({
    activities: z.boolean().optional(),
    steps: z.boolean().optional(),
    sleep: z.boolean().optional(),
    weight: z.boolean().optional(),
    water: z.boolean().optional(),
  }),
});
export type UpdateSyncPreferencesInput = z.infer<typeof updateSyncPreferencesSchema>;

export const getIntegrationStatusSchema = z.object({
  provider: z.enum(['STRAVA', 'GOOGLE_FIT', 'FITBIT', 'GARMIN']),
});
export type GetIntegrationStatusInput = z.infer<typeof getIntegrationStatusSchema>;
