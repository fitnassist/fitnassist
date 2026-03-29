import { integrationRepository } from '../repositories/integration.repository';
import { stravaService } from './strava.service';
import { googleFitService } from './google-fit.service';
import { fitbitService } from './fitbit.service';
import { inAppNotificationService } from './in-app-notification.service';
import type { IntegrationProvider } from '@fitnassist/database';

const PROVIDER_LABELS: Record<IntegrationProvider, string> = {
  STRAVA: 'Strava',
  GOOGLE_FIT: 'Google Fit',
  FITBIT: 'Fitbit',
  GARMIN: 'Garmin',
};

const refreshForProvider = async (
  provider: IntegrationProvider,
  refreshToken: string
): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> => {
  switch (provider) {
    case 'STRAVA':
      return stravaService.refreshToken(refreshToken);

    case 'GOOGLE_FIT': {
      const result = await googleFitService.refreshToken(refreshToken);
      return { accessToken: result.accessToken, expiresAt: result.expiresAt };
    }

    case 'FITBIT': {
      const result = await fitbitService.refreshToken(refreshToken);
      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresAt: result.expiresAt,
      };
    }

    case 'GARMIN':
      // Garmin uses OAuth1a — tokens don't expire
      throw new Error('Garmin tokens do not expire');
  }
};

export const tokenRefreshService = {
  /**
   * Proactively refresh tokens expiring within 60 minutes.
   * Called by the cron job.
   */
  async refreshExpiringTokens() {
    const expiringConnections = await integrationRepository.findTokensExpiringWithin(60);
    let refreshed = 0;
    let failed = 0;

    for (const connection of expiringConnections) {
      // Garmin uses OAuth1a — no token expiry
      if (connection.provider === 'GARMIN') continue;
      if (!connection.refreshToken) continue;

      try {
        const newTokens = await refreshForProvider(connection.provider, connection.refreshToken);

        await integrationRepository.updateTokens(connection.userId, connection.provider, {
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken ?? connection.refreshToken,
          tokenExpiresAt: newTokens.expiresAt ?? null,
        });

        refreshed++;
        console.log(`[TokenRefresh] Refreshed ${connection.provider} for user ${connection.userId}`);
      } catch (err) {
        failed++;
        console.error(`[TokenRefresh] Failed for ${connection.provider}/${connection.userId}:`, err);

        await this.handleRefreshError(connection.userId, connection.provider);
      }
    }

    console.log(`[TokenRefresh] Refreshed ${refreshed}, failed ${failed} of ${expiringConnections.length}`);
    return { refreshed, failed, total: expiringConnections.length };
  },

  /**
   * Handle a refresh error — mark the connection as ERROR and notify the user.
   */
  async handleRefreshError(userId: string, provider: IntegrationProvider) {
    await integrationRepository.updateSyncStatus(userId, provider, {
      status: 'ERROR',
      lastSyncError: 'Token refresh failed — please reconnect',
    });

    const label = PROVIDER_LABELS[provider] ?? provider;
    await inAppNotificationService.notify({
      userId,
      type: 'DIARY_ENTRY', // Reuse existing notification type
      title: `${label} connection expired — please reconnect in Settings`,
      link: '/dashboard/settings?tab=integrations',
    }).catch(console.error);
  },
};
