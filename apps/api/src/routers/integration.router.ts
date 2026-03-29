import { router, protectedProcedure } from '../lib/trpc';
import { integrationService } from '../services/integration.service';
import {
  disconnectIntegrationSchema,
  updateSyncPreferencesSchema,
  getIntegrationStatusSchema,
} from '@fitnassist/schemas';

export const integrationRouter = router({
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
