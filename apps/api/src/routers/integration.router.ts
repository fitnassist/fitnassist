import { router, protectedProcedure } from '../lib/trpc';
import { integrationService } from '../services/integration.service';
import { env } from '../config/env';
import {
  disconnectIntegrationSchema,
  updateSyncPreferencesSchema,
  getIntegrationStatusSchema,
} from '@fitnassist/schemas';
import type { IntegrationProvider } from '@fitnassist/database';

const getAvailableProviders = (): IntegrationProvider[] => {
  const providers: IntegrationProvider[] = [];
  if (env.STRAVA_CLIENT_ID && env.STRAVA_CLIENT_SECRET) providers.push('STRAVA');
  if (env.GOOGLE_FIT_CLIENT_ID && env.GOOGLE_FIT_CLIENT_SECRET) providers.push('GOOGLE_FIT');
  if (env.FITBIT_CLIENT_ID && env.FITBIT_CLIENT_SECRET) providers.push('FITBIT');
  if (env.GARMIN_CONSUMER_KEY && env.GARMIN_CONSUMER_SECRET) providers.push('GARMIN');
  return providers;
};

export const integrationRouter = router({
  availableProviders: protectedProcedure.query(() => {
    return getAvailableProviders();
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return integrationService.getConnections(ctx.user.id);
  }),

  status: protectedProcedure
    .input(getIntegrationStatusSchema)
    .query(async ({ ctx, input }) => {
      return integrationService.getConnectionStatus(ctx.user.id, input.provider);
    }),

  disconnect: protectedProcedure
    .input(disconnectIntegrationSchema)
    .mutation(async ({ ctx, input }) => {
      return integrationService.disconnect(ctx.user.id, input.provider);
    }),

  updatePreferences: protectedProcedure
    .input(updateSyncPreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      return integrationService.updateSyncPreferences(
        ctx.user.id,
        input.provider,
        input.preferences
      );
    }),
});
