import { router, protectedProcedure } from "../lib/trpc";
import { integrationService } from "../services/integration.service";
import { env } from "../config/env";
import {
  disconnectIntegrationSchema,
  updateSyncPreferencesSchema,
  getIntegrationStatusSchema,
  connectDeviceSchema,
} from "@fitnassist/schemas";
import type { IntegrationProvider } from "@fitnassist/database";
import { integrationRepository } from "../repositories/integration.repository";

const DEVICE_PROVIDERS: IntegrationProvider[] = ["APPLE_HEALTH"];

const getAvailableProviders = (): IntegrationProvider[] => {
  const providers: IntegrationProvider[] = [];
  if (env.STRAVA_CLIENT_ID && env.STRAVA_CLIENT_SECRET)
    providers.push("STRAVA");
  if (env.GOOGLE_FIT_CLIENT_ID && env.GOOGLE_FIT_CLIENT_SECRET)
    providers.push("GOOGLE_FIT");
  if (env.FITBIT_CLIENT_ID && env.FITBIT_CLIENT_SECRET)
    providers.push("FITBIT");
  if (env.GARMIN_CONSUMER_KEY && env.GARMIN_CONSUMER_SECRET)
    providers.push("GARMIN");
  // On-device integrations are always available
  providers.push(...DEVICE_PROVIDERS);
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
      return integrationService.getConnectionStatus(
        ctx.user.id,
        input.provider,
      );
    }),

  connectDevice: protectedProcedure
    .input(connectDeviceSchema)
    .mutation(async ({ ctx, input }) => {
      // On-device integrations (Apple Health) don't use OAuth tokens.
      // Create the connection record with a placeholder token.
      await integrationRepository.upsert(ctx.user.id, input.provider, {
        accessToken: "device",
        refreshToken: null,
        tokenExpiresAt: null,
        scope: null,
        externalUserId: null,
      });
      return { success: true };
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
        input.preferences,
      );
    }),
});
