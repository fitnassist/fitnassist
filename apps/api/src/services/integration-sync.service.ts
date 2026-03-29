import { diaryRepository } from '../repositories/diary.repository';
import { integrationRepository } from '../repositories/integration.repository';
import { diaryService } from './diary.service';
import type { ActivityType, ActivitySource, IntegrationProvider } from '@fitnassist/database';

export interface ExternalActivity {
  externalId: string;
  activityType: ActivityType;
  activityName?: string;
  date: string; // YYYY-MM-DD
  startTime: Date;
  durationSeconds: number;
  distanceKm?: number;
  elevationGainM?: number;
  caloriesBurned?: number;
  routePolyline?: string;
  startLatitude?: number;
  startLongitude?: number;
  endLatitude?: number;
  endLongitude?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
}

const TIME_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

const providerToSource: Record<IntegrationProvider, ActivitySource> = {
  STRAVA: 'STRAVA',
  GOOGLE_FIT: 'GOOGLE_FIT',
  FITBIT: 'FITBIT',
  GARMIN: 'GARMIN',
};

export const integrationSyncService = {
  /**
   * Sync an activity from an external provider.
   * Deduplicates by externalId, skips if manual entry exists in same time window.
   * Routes through diaryService.logActivity so all side effects trigger.
   */
  async syncActivity(userId: string, provider: IntegrationProvider, activity: ExternalActivity) {
    const source = providerToSource[provider];

    // Check for duplicate by externalId
    const existing = await diaryRepository.findActivityByExternalId(activity.externalId);
    if (existing) {
      console.log(`[Sync] Skipping duplicate activity ${activity.externalId}`);
      return null;
    }

    // Check for manual entry in same time window (±30 min)
    const windowStart = new Date(activity.startTime.getTime() - TIME_WINDOW_MS);
    const windowEnd = new Date(activity.startTime.getTime() + TIME_WINDOW_MS);
    const manualActivities = await diaryRepository.findActivitiesInTimeWindow(userId, windowStart, windowEnd);
    const hasManual = manualActivities.some(
      entry => entry.activityEntry?.source === 'MANUAL'
    );
    if (hasManual) {
      console.log(`[Sync] Skipping activity ${activity.externalId} — manual entry exists in time window`);
      return null;
    }

    // Use diaryService.logActivity to trigger all side effects (goals, PBs, badges, SSE)
    return diaryService.logActivity(userId, {
      date: activity.date,
      activityType: activity.activityType,
      activityName: activity.activityName,
      durationSeconds: activity.durationSeconds,
      distanceKm: activity.distanceKm,
      elevationGainM: activity.elevationGainM,
      caloriesBurned: activity.caloriesBurned,
      source,
      externalId: activity.externalId,
      routePolyline: activity.routePolyline,
      startLatitude: activity.startLatitude,
      startLongitude: activity.startLongitude,
      endLatitude: activity.endLatitude,
      endLongitude: activity.endLongitude,
      avgHeartRate: activity.avgHeartRate,
      maxHeartRate: activity.maxHeartRate,
    });
  },

  /**
   * Sync steps — only writes if no manual entry exists, or synced value is higher.
   */
  async syncSteps(userId: string, provider: IntegrationProvider, date: string, steps: number) {
    const source = providerToSource[provider];
    const dateObj = new Date(date + 'T00:00:00.000Z');

    const hasManual = await diaryRepository.hasManualEntryForDate(userId, dateObj, 'STEPS');
    if (hasManual) {
      console.log(`[Sync] Skipping steps for ${date} — manual entry exists`);
      return null;
    }

    return diaryService.logSteps(userId, { date, totalSteps: steps, source });
  },

  /**
   * Sync sleep — only writes if no manual entry exists.
   */
  async syncSleep(
    userId: string,
    provider: IntegrationProvider,
    date: string,
    hoursSlept: number,
    quality: number = 3
  ) {
    const source = providerToSource[provider];
    const dateObj = new Date(date + 'T00:00:00.000Z');

    const hasManual = await diaryRepository.hasManualEntryForDate(userId, dateObj, 'SLEEP');
    if (hasManual) {
      console.log(`[Sync] Skipping sleep for ${date} — manual entry exists`);
      return null;
    }

    return diaryService.logSleep(userId, { date, hoursSlept, quality, source });
  },

  /**
   * Sync weight — only writes if no manual entry exists.
   */
  async syncWeight(userId: string, provider: IntegrationProvider, date: string, weightKg: number) {
    const source = providerToSource[provider];
    const dateObj = new Date(date + 'T00:00:00.000Z');

    const hasManual = await diaryRepository.hasManualEntryForDate(userId, dateObj, 'WEIGHT');
    if (hasManual) {
      console.log(`[Sync] Skipping weight for ${date} — manual entry exists`);
      return null;
    }

    return diaryService.logWeight(userId, { date, weightKg, source });
  },

  /**
   * Sync water — only writes if no manual entry exists.
   */
  async syncWater(userId: string, provider: IntegrationProvider, date: string, totalMl: number) {
    const source = providerToSource[provider];
    const dateObj = new Date(date + 'T00:00:00.000Z');

    const hasManual = await diaryRepository.hasManualEntryForDate(userId, dateObj, 'WATER');
    if (hasManual) {
      console.log(`[Sync] Skipping water for ${date} — manual entry exists`);
      return null;
    }

    return diaryService.logWater(userId, { date, totalMl, source });
  },

  /**
   * Update sync status after a sync operation completes.
   */
  async markSyncComplete(userId: string, provider: IntegrationProvider, error?: string) {
    await integrationRepository.updateSyncStatus(userId, provider, {
      status: error ? 'ERROR' : 'CONNECTED',
      lastSyncAt: new Date(),
      lastSyncError: error ?? null,
    });
  },

  /**
   * Mark initial history import as complete.
   */
  async markImportComplete(userId: string, provider: IntegrationProvider) {
    await integrationRepository.updateSyncStatus(userId, provider, {
      initialImportComplete: true,
    });
  },
};
