import { googleFitClient } from '../lib/google-fit';
import { integrationRepository } from '../repositories/integration.repository';
import { integrationSyncService } from './integration-sync.service';
import { integrationService } from './integration.service';
import type { ActivityType } from '@fitnassist/database';

const msToDateStr = (ms: number): string => {
  const d = new Date(ms);
  return d.toISOString().slice(0, 10);
};

export const googleFitService = {
  getAuthUrl(userId: string): string {
    return googleFitClient.getAuthUrl(userId);
  },

  async exchangeToken(code: string, userId: string) {
    const tokens = await googleFitClient.exchangeToken(code);

    await integrationRepository.upsert(userId, 'GOOGLE_FIT', {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    });

    // Background history import
    this.importHistory(userId).catch(err =>
      console.error(`[Google Fit] History import failed for ${userId}:`, err)
    );

    return { success: true };
  },

  async refreshToken(refreshToken: string) {
    const result = await googleFitClient.refreshToken(refreshToken);
    return {
      accessToken: result.access_token,
      expiresAt: new Date(Date.now() + result.expires_in * 1000),
    };
  },

  async syncAll(userId: string) {
    const connection = await integrationRepository.findByUserAndProvider(userId, 'GOOGLE_FIT');
    if (!connection || connection.status !== 'CONNECTED') return;

    const prefs = (connection.syncPreferences as Record<string, boolean> | null) ?? {
      activities: true, steps: true, sleep: true, weight: true, water: true,
    };

    await integrationRepository.updateSyncStatus(userId, 'GOOGLE_FIT', { status: 'SYNCING' });

    try {
      const endMs = Date.now();
      const startMs = endMs - 24 * 60 * 60 * 1000; // Last 24 hours

      if (prefs.steps) await this.syncSteps(userId, startMs, endMs).catch(console.error);
      if (prefs.sleep) await this.syncSleep(userId, startMs, endMs).catch(console.error);
      if (prefs.weight) await this.syncWeight(userId, startMs, endMs).catch(console.error);
      if (prefs.activities) await this.syncActivities(userId, startMs, endMs).catch(console.error);

      await integrationSyncService.markSyncComplete(userId, 'GOOGLE_FIT');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[Google Fit] Sync error for ${userId}:`, err);
      await integrationSyncService.markSyncComplete(userId, 'GOOGLE_FIT', message);
    }
  },

  async syncSteps(userId: string, startMs: number, endMs: number) {
    const data = await integrationService.withTokenRefresh(
      userId,
      'GOOGLE_FIT',
      (token) => googleFitClient.aggregateData(token, 'com.google.step_count.delta', startMs, endMs),
      (rt) => this.refreshToken(rt)
    );

    for (const bucket of data.bucket) {
      const date = msToDateStr(Number(bucket.startTimeMillis));
      let totalSteps = 0;
      for (const ds of bucket.dataset) {
        for (const point of ds.point) {
          totalSteps += point.value[0]?.intVal ?? 0;
        }
      }
      if (totalSteps > 0) {
        await integrationSyncService.syncSteps(userId, 'GOOGLE_FIT', date, totalSteps);
      }
    }
  },

  async syncSleep(userId: string, startMs: number, endMs: number) {
    const data = await integrationService.withTokenRefresh(
      userId,
      'GOOGLE_FIT',
      (token) => googleFitClient.aggregateData(token, 'com.google.sleep.segment', startMs, endMs),
      (rt) => this.refreshToken(rt)
    );

    for (const bucket of data.bucket) {
      const date = msToDateStr(Number(bucket.startTimeMillis));
      let totalNanos = 0;
      for (const ds of bucket.dataset) {
        for (const point of ds.point) {
          const start = Number(point.startTimeNanos);
          const end = Number(point.endTimeNanos);
          totalNanos += end - start;
        }
      }
      const hours = totalNanos / (1e9 * 3600);
      if (hours > 0) {
        await integrationSyncService.syncSleep(userId, 'GOOGLE_FIT', date, Math.round(hours * 10) / 10);
      }
    }
  },

  async syncWeight(userId: string, startMs: number, endMs: number) {
    const data = await integrationService.withTokenRefresh(
      userId,
      'GOOGLE_FIT',
      (token) => googleFitClient.aggregateData(token, 'com.google.weight', startMs, endMs),
      (rt) => this.refreshToken(rt)
    );

    for (const bucket of data.bucket) {
      const date = msToDateStr(Number(bucket.startTimeMillis));
      for (const ds of bucket.dataset) {
        const lastPoint = ds.point[ds.point.length - 1];
        const weightKg = lastPoint?.value[0]?.fpVal;
        if (weightKg && weightKg > 0) {
          await integrationSyncService.syncWeight(userId, 'GOOGLE_FIT', date, Math.round(weightKg * 10) / 10);
        }
      }
    }
  },

  async syncActivities(userId: string, startMs: number, endMs: number) {
    const sessionsData = await integrationService.withTokenRefresh(
      userId,
      'GOOGLE_FIT',
      (token) => googleFitClient.getSessions(token, startMs, endMs),
      (rt) => this.refreshToken(rt)
    );

    for (const session of sessionsData.session ?? []) {
      const activityType = googleFitClient.mapActivityType(session.activityType) as ActivityType;
      const startTime = new Date(Number(session.startTimeMillis));
      const endTime = new Date(Number(session.endTimeMillis));
      const durationSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

      if (durationSeconds < 60) continue; // Skip very short sessions

      await integrationSyncService.syncActivity(userId, 'GOOGLE_FIT', {
        externalId: `gfit_${session.id}`,
        activityType,
        activityName: session.name || undefined,
        date: startTime.toISOString().slice(0, 10),
        startTime,
        durationSeconds,
      });
    }
  },

  async importHistory(userId: string) {
    console.log(`[Google Fit] Starting history import for ${userId}`);
    await integrationRepository.updateSyncStatus(userId, 'GOOGLE_FIT', { status: 'SYNCING' });

    try {
      const endMs = Date.now();
      const startMs = endMs - 30 * 24 * 60 * 60 * 1000; // 30 days

      await this.syncSteps(userId, startMs, endMs).catch(console.error);
      await this.syncSleep(userId, startMs, endMs).catch(console.error);
      await this.syncWeight(userId, startMs, endMs).catch(console.error);
      await this.syncActivities(userId, startMs, endMs).catch(console.error);

      await integrationSyncService.markImportComplete(userId, 'GOOGLE_FIT');
      await integrationSyncService.markSyncComplete(userId, 'GOOGLE_FIT');
      console.log(`[Google Fit] History import complete for ${userId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[Google Fit] History import error for ${userId}:`, err);
      await integrationSyncService.markSyncComplete(userId, 'GOOGLE_FIT', message);
    }
  },
};
