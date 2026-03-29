import { garminClient } from '../lib/garmin';
import type { GarminPushActivity, GarminPushDaily, GarminPushSleep, GarminPushBody } from '../lib/garmin';
import { integrationRepository } from '../repositories/integration.repository';
import { integrationSyncService } from './integration-sync.service';
import type { ActivityType } from '@fitnassist/database';

export const garminService = {
  async getAuthUrl(userId: string): Promise<string> {
    return garminClient.getRequestToken(userId);
  },

  async exchangeToken(oauthToken: string, oauthVerifier: string) {
    const result = await garminClient.exchangeAccessToken(oauthToken, oauthVerifier);

    // For Garmin OAuth1a, we store the access token + token secret combined
    // Format: "token:secret"
    await integrationRepository.upsert(result.userId, 'GARMIN', {
      accessToken: `${result.accessToken}:${result.tokenSecret}`,
      externalUserId: result.garminUserId,
    });

    return { success: true };
  },

  async handleActivityPush(activity: GarminPushActivity) {
    const connection = await integrationRepository.findByExternalUserId('GARMIN', activity.userAccessToken);
    if (!connection || connection.status !== 'CONNECTED') {
      console.log(`[Garmin] No active connection for user token ${activity.userAccessToken.slice(0, 8)}...`);
      return;
    }

    const activityType = garminClient.mapActivityType(activity.activityType) as ActivityType;
    const startTime = new Date(activity.startTimeInSeconds * 1000);
    const date = startTime.toISOString().slice(0, 10);

    await integrationSyncService.syncActivity(connection.userId, 'GARMIN', {
      externalId: `garmin_${activity.summaryId}`,
      activityType,
      activityName: activity.activityType.replace(/_/g, ' ').toLowerCase(),
      date,
      startTime,
      durationSeconds: activity.durationInSeconds,
      distanceKm: activity.distanceInMeters ? activity.distanceInMeters / 1000 : undefined,
      caloriesBurned: activity.activeKilocalories,
      avgHeartRate: activity.averageHeartRateInBeatsPerMinute,
      maxHeartRate: activity.maxHeartRateInBeatsPerMinute,
    });

    await integrationSyncService.markSyncComplete(connection.userId, 'GARMIN');
  },

  async handleDailyPush(daily: GarminPushDaily) {
    const connection = await integrationRepository.findByExternalUserId('GARMIN', daily.userAccessToken);
    if (!connection || connection.status !== 'CONNECTED') return;

    if (daily.steps && daily.steps > 0) {
      await integrationSyncService.syncSteps(connection.userId, 'GARMIN', daily.calendarDate, daily.steps);
    }

    await integrationSyncService.markSyncComplete(connection.userId, 'GARMIN');
  },

  async handleSleepPush(sleep: GarminPushSleep) {
    const connection = await integrationRepository.findByExternalUserId('GARMIN', sleep.userAccessToken);
    if (!connection || connection.status !== 'CONNECTED') return;

    if (sleep.durationInSeconds > 0) {
      const hours = Math.round((sleep.durationInSeconds / 3600) * 10) / 10;
      // Map Garmin sleep validation to quality
      const qualityMap: Record<string, number> = {
        ENHANCED_TENTATIVE: 2,
        ENHANCED_FINAL: 4,
        DEVICE: 3,
        AUTO_TENTATIVE: 2,
        AUTO_FINAL: 3,
      };
      const quality = qualityMap[sleep.validation] ?? 3;
      await integrationSyncService.syncSleep(connection.userId, 'GARMIN', sleep.calendarDate, hours, quality);
    }

    await integrationSyncService.markSyncComplete(connection.userId, 'GARMIN');
  },

  async handleBodyPush(body: GarminPushBody) {
    const connection = await integrationRepository.findByExternalUserId('GARMIN', body.userAccessToken);
    if (!connection || connection.status !== 'CONNECTED') return;

    if (body.weightInGrams && body.weightInGrams > 0) {
      const weightKg = Math.round(body.weightInGrams / 100) / 10;
      await integrationSyncService.syncWeight(connection.userId, 'GARMIN', body.calendarDate, weightKg);
    }

    await integrationSyncService.markSyncComplete(connection.userId, 'GARMIN');
  },
};
