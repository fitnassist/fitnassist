import { fitbitClient } from '../lib/fitbit';
import { integrationRepository } from '../repositories/integration.repository';
import { integrationSyncService } from './integration-sync.service';
import { integrationService } from './integration.service';
import type { ActivityType } from '@fitnassist/database';

export const fitbitService = {
  getAuthUrl(userId: string): string {
    return fitbitClient.getAuthUrl(userId);
  },

  async exchangeToken(code: string, userId: string) {
    const tokens = await fitbitClient.exchangeToken(code);

    await integrationRepository.upsert(userId, 'FITBIT', {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      externalUserId: tokens.user_id,
    });

    // Background history import
    this.importHistory(userId).catch(err =>
      console.error(`[Fitbit] History import failed for ${userId}:`, err)
    );

    return { userId: tokens.user_id };
  },

  async refreshToken(refreshToken: string) {
    const result = await fitbitClient.refreshToken(refreshToken);
    return {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      expiresAt: new Date(Date.now() + result.expires_in * 1000),
    };
  },

  async syncDate(userId: string, date: string) {
    const connection = await integrationRepository.findByUserAndProvider(userId, 'FITBIT');
    if (!connection || connection.status !== 'CONNECTED') return;

    const prefs = (connection.syncPreferences as Record<string, boolean> | null) ?? {
      activities: true, steps: true, sleep: true, weight: true, water: true,
    };

    try {
      if (prefs.activities) await this.syncActivities(userId, date).catch(console.error);
      if (prefs.steps) await this.syncSteps(userId, date).catch(console.error);
      if (prefs.sleep) await this.syncSleep(userId, date).catch(console.error);
      if (prefs.weight) await this.syncWeight(userId, date).catch(console.error);
      if (prefs.water) await this.syncWater(userId, date).catch(console.error);

      await integrationSyncService.markSyncComplete(userId, 'FITBIT');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      await integrationSyncService.markSyncComplete(userId, 'FITBIT', message);
    }
  },

  async syncActivities(userId: string, date: string) {
    const data = await integrationService.withTokenRefresh(
      userId,
      'FITBIT',
      (token) => fitbitClient.getActivities(token, date),
      (rt) => this.refreshToken(rt)
    );

    for (const activity of data.activities) {
      const activityType = fitbitClient.mapActivityType(activity.activityTypeId) as ActivityType;
      const durationSeconds = Math.round(activity.duration / 1000);
      if (durationSeconds < 60) continue;

      await integrationSyncService.syncActivity(userId, 'FITBIT', {
        externalId: `fitbit_${activity.logId}`,
        activityType,
        activityName: activity.activityName,
        date: activity.startDate,
        startTime: new Date(`${activity.startDate}T${activity.startTime}`),
        durationSeconds,
        distanceKm: activity.distance,
        elevationGainM: activity.elevationGain,
        caloriesBurned: activity.calories > 0 ? activity.calories : undefined,
        avgHeartRate: activity.averageHeartRate,
      });
    }
  },

  async syncSteps(userId: string, date: string) {
    const data = await integrationService.withTokenRefresh(
      userId,
      'FITBIT',
      (token) => fitbitClient.getSteps(token, date),
      (rt) => this.refreshToken(rt)
    );

    for (const entry of data['activities-steps']) {
      const steps = parseInt(entry.value, 10);
      if (steps > 0) {
        await integrationSyncService.syncSteps(userId, 'FITBIT', entry.dateTime, steps);
      }
    }
  },

  async syncSleep(userId: string, date: string) {
    const data = await integrationService.withTokenRefresh(
      userId,
      'FITBIT',
      (token) => fitbitClient.getSleep(token, date),
      (rt) => this.refreshToken(rt)
    );

    const totalMinutes = data.summary?.totalMinutesAsleep ?? 0;
    if (totalMinutes > 0) {
      const hours = Math.round((totalMinutes / 60) * 10) / 10;
      // Map efficiency (0-100) to quality (1-5)
      const avgEfficiency = data.sleep.length > 0
        ? data.sleep.reduce((sum, s) => sum + s.efficiency, 0) / data.sleep.length
        : 75;
      const quality = Math.min(5, Math.max(1, Math.round(avgEfficiency / 20)));
      await integrationSyncService.syncSleep(userId, 'FITBIT', date, hours, quality);
    }
  },

  async syncWeight(userId: string, date: string) {
    const data = await integrationService.withTokenRefresh(
      userId,
      'FITBIT',
      (token) => fitbitClient.getWeight(token, date),
      (rt) => this.refreshToken(rt)
    );

    for (const entry of data.weight) {
      if (entry.weight > 0) {
        await integrationSyncService.syncWeight(userId, 'FITBIT', entry.date, Math.round(entry.weight * 10) / 10);
      }
    }
  },

  async syncWater(userId: string, date: string) {
    const data = await integrationService.withTokenRefresh(
      userId,
      'FITBIT',
      (token) => fitbitClient.getWater(token, date),
      (rt) => this.refreshToken(rt)
    );

    const totalMl = data.summary?.water ?? 0;
    if (totalMl > 0) {
      await integrationSyncService.syncWater(userId, 'FITBIT', date, Math.round(totalMl));
    }
  },

  async handleWebhookEvent(notification: {
    collectionType: string;
    date: string;
    ownerId: string;
    ownerType: string;
    subscriptionId: string;
  }) {
    const connection = await integrationRepository.findByExternalUserId('FITBIT', notification.ownerId);
    if (!connection || connection.status !== 'CONNECTED') {
      console.log(`[Fitbit] No active connection for user ${notification.ownerId}`);
      return;
    }

    console.log(`[Fitbit] Webhook: ${notification.collectionType} for ${notification.date}`);
    await this.syncDate(connection.userId, notification.date);
  },

  async importHistory(userId: string) {
    console.log(`[Fitbit] Starting history import for ${userId}`);
    await integrationRepository.updateSyncStatus(userId, 'FITBIT', { status: 'SYNCING' });

    try {
      const now = new Date();
      for (let i = 0; i < 30; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().slice(0, 10);
        await this.syncDate(userId, dateStr).catch(console.error);
      }

      await integrationSyncService.markImportComplete(userId, 'FITBIT');
      await integrationSyncService.markSyncComplete(userId, 'FITBIT');
      console.log(`[Fitbit] History import complete for ${userId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[Fitbit] History import error for ${userId}:`, err);
      await integrationSyncService.markSyncComplete(userId, 'FITBIT', message);
    }
  },
};
