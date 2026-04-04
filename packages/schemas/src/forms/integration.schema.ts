import { z } from 'zod';

export const integrationProviderEnum = z.enum([
  'STRAVA',
  'GOOGLE_FIT',
  'FITBIT',
  'GARMIN',
  'APPLE_HEALTH',
]);

export const disconnectIntegrationSchema = z.object({
  provider: integrationProviderEnum,
});
export type DisconnectIntegrationInput = z.infer<typeof disconnectIntegrationSchema>;

export const updateSyncPreferencesSchema = z.object({
  provider: integrationProviderEnum,
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
  provider: integrationProviderEnum,
});
export type GetIntegrationStatusInput = z.infer<typeof getIntegrationStatusSchema>;

export const connectDeviceSchema = z.object({
  provider: z.enum(['APPLE_HEALTH']),
});
export type ConnectDeviceInput = z.infer<typeof connectDeviceSchema>;
