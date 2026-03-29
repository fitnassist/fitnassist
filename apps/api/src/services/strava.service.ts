import { stravaClient } from '../lib/strava';
import type { StravaActivity, StravaWebhookEvent } from '../lib/strava';
import { integrationRepository } from '../repositories/integration.repository';
import { integrationSyncService } from './integration-sync.service';
import { integrationService } from './integration.service';
import type { ActivityType } from '@fitnassist/database';
import type { ExternalActivity } from './integration-sync.service';

const STRAVA_TYPE_MAP: Record<string, ActivityType> = {
  Run: 'RUN',
  TrailRun: 'RUN',
  Walk: 'WALK',
  Hike: 'HIKE',
  Ride: 'CYCLE',
  GravelRide: 'CYCLE',
  MountainBikeRide: 'CYCLE',
  VirtualRide: 'CYCLE',
  EBikeRide: 'CYCLE',
  Swim: 'SWIM',
};

const mapStravaActivity = (activity: StravaActivity): ExternalActivity => {
  const activityType = STRAVA_TYPE_MAP[activity.type] ?? STRAVA_TYPE_MAP[activity.sport_type] ?? 'OTHER';
  const startDate = new Date(activity.start_date);
  const dateStr = activity.start_date_local.slice(0, 10);

  return {
    externalId: `strava_${activity.id}`,
    activityType,
    activityName: activity.name,
    date: dateStr,
    startTime: startDate,
    durationSeconds: activity.moving_time,
    distanceKm: activity.distance > 0 ? activity.distance / 1000 : undefined,
    elevationGainM: activity.total_elevation_gain > 0 ? activity.total_elevation_gain : undefined,
    caloriesBurned: activity.calories && activity.calories > 0 ? Math.round(activity.calories) : undefined,
    routePolyline: activity.map?.summary_polyline || activity.map?.polyline || undefined,
    startLatitude: activity.start_latlng?.[0],
    startLongitude: activity.start_latlng?.[1],
    endLatitude: activity.end_latlng?.[0],
    endLongitude: activity.end_latlng?.[1],
    avgHeartRate: activity.average_heartrate ? Math.round(activity.average_heartrate) : undefined,
    maxHeartRate: activity.max_heartrate ? Math.round(activity.max_heartrate) : undefined,
  };
};

export const stravaService = {
  getAuthUrl(userId: string): string {
    return stravaClient.getAuthUrl(userId);
  },

  async exchangeToken(code: string, userId: string) {
    const tokens = await stravaClient.exchangeToken(code);

    await integrationRepository.upsert(userId, 'STRAVA', {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: new Date(tokens.expires_at * 1000),
      externalUserId: String(tokens.athlete.id),
      scope: 'read,activity:read_all',
    });

    // Trigger background history import (fire-and-forget)
    this.importHistory(userId).catch(err =>
      console.error(`[Strava] History import failed for ${userId}:`, err)
    );

    return { athleteId: tokens.athlete.id, name: `${tokens.athlete.firstname} ${tokens.athlete.lastname}` };
  },

  async refreshToken(refreshToken: string) {
    const result = await stravaClient.refreshToken(refreshToken);
    return {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      expiresAt: new Date(result.expires_at * 1000),
    };
  },

  async importHistory(userId: string) {
    console.log(`[Strava] Starting history import for ${userId}`);
    const connection = await integrationRepository.findByUserAndProvider(userId, 'STRAVA');
    if (!connection) return;

    await integrationRepository.updateSyncStatus(userId, 'STRAVA', { status: 'SYNCING' });

    try {
      const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const activities = await integrationService.withTokenRefresh(
          userId,
          'STRAVA',
          (token) => stravaClient.getActivities(token, { after: thirtyDaysAgo, page, perPage: 50 }),
          (rt) => this.refreshToken(rt)
        );

        for (const activity of activities) {
          try {
            const mapped = mapStravaActivity(activity);
            await integrationSyncService.syncActivity(userId, 'STRAVA', mapped);
          } catch (err) {
            console.error(`[Strava] Failed to sync activity ${activity.id}:`, err);
          }
        }

        hasMore = activities.length === 50;
        page++;
      }

      await integrationSyncService.markImportComplete(userId, 'STRAVA');
      await integrationSyncService.markSyncComplete(userId, 'STRAVA');
      console.log(`[Strava] History import complete for ${userId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[Strava] History import error for ${userId}:`, err);
      await integrationSyncService.markSyncComplete(userId, 'STRAVA', message);
    }
  },

  async syncSingleActivity(userId: string, activityId: number) {
    const activity = await integrationService.withTokenRefresh(
      userId,
      'STRAVA',
      (token) => stravaClient.getActivity(token, activityId),
      (rt) => this.refreshToken(rt)
    );

    const mapped = mapStravaActivity(activity);
    return integrationSyncService.syncActivity(userId, 'STRAVA', mapped);
  },

  async handleWebhookEvent(event: StravaWebhookEvent) {
    if (event.object_type !== 'activity') return;

    // Find the user by Strava athlete ID
    const connection = await integrationRepository.findByExternalUserId(
      'STRAVA',
      String(event.owner_id)
    );
    if (!connection || connection.status !== 'CONNECTED') {
      console.log(`[Strava] No active connection for athlete ${event.owner_id}`);
      return;
    }

    const userId = connection.userId;

    switch (event.aspect_type) {
      case 'create':
      case 'update':
        try {
          await this.syncSingleActivity(userId, event.object_id);
          await integrationSyncService.markSyncComplete(userId, 'STRAVA');
        } catch (err) {
          console.error(`[Strava] Webhook sync failed for activity ${event.object_id}:`, err);
        }
        break;

      case 'delete':
        // We don't delete synced entries — the user can delete them manually
        console.log(`[Strava] Activity ${event.object_id} deleted on Strava (no action taken)`);
        break;
    }
  },

  async deauthorize(userId: string) {
    const connection = await integrationRepository.findByUserAndProvider(userId, 'STRAVA');
    if (!connection) return;

    try {
      await stravaClient.deauthorize(connection.accessToken);
    } catch {
      // Best effort — token may already be invalid
    }

    await integrationRepository.disconnect(userId, 'STRAVA');
  },
};
