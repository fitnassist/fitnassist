import { Router } from 'express';
import { env } from '../config/env';
import { weeklyReportService } from '../services/weekly-report.service';
import { bookingNotificationService } from '../services/booking-notification.service';
import { bookingService } from '../services/booking.service';
import { notificationRepository } from '../repositories/notification.repository';
import { tokenRefreshService } from '../services/token-refresh.service';
import { integrationRepository } from '../repositories/integration.repository';
import { integrationService } from '../services/integration.service';
import { googleFitService } from '../services/google-fit.service';
import { stravaService } from '../services/strava.service';
import { stravaClient } from '../lib/strava';
import { referralService } from '../services/referral.service';

export const cronRouter = Router();

cronRouter.post('/weekly-reports', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const result = await weeklyReportService.sendWeeklyReports();
    res.json({ ok: true, ...result });
  } catch (error) {
    console.error('[Cron] Weekly reports failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

cronRouter.post('/booking-reminders', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const result = await bookingNotificationService.sendBookingReminders();
    res.json({ ok: true, ...result });
  } catch (error) {
    console.error('[Cron] Booking reminders failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

cronRouter.post('/client-weekly-reports', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const result = await weeklyReportService.sendClientWeeklyReports();
    res.json({ ok: true, ...result });
  } catch (error) {
    console.error('[Cron] Client weekly reports failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

cronRouter.post('/booking-hold-expiry', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const result = await bookingService.expirePendingBookings();
    res.json({ ok: true, ...result });
  } catch (error) {
    console.error('[Cron] Booking hold expiry failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

cronRouter.post('/cleanup-video-rooms', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const result = await bookingService.cleanupExpiredVideoRooms();
    res.json({ ok: true, ...result });
  } catch (error) {
    console.error('[Cron] Video room cleanup failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

cronRouter.post('/cleanup-notifications', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const [dismissed, old] = await Promise.all([
      notificationRepository.deleteDismissedOlderThan(30),
      notificationRepository.deleteOlderThan(90),
    ]);
    console.log(`[Cron] Notification cleanup: dismissed=${dismissed.count}, old=${old.count}`);
    res.json({ ok: true, dismissed: dismissed.count, old: old.count });
  } catch (error) {
    console.error('[Cron] Notification cleanup failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================================================
// INTEGRATION CRONS
// =============================================================================

cronRouter.post('/token-refresh', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const result = await tokenRefreshService.refreshExpiringTokens();
    res.json({ ok: true, ...result });
  } catch (error) {
    console.error('[Cron] Token refresh failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

cronRouter.post('/integration-sync', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    // Poll Google Fit (no webhooks — polling only)
    const googleFitConnections = await integrationRepository.findAllConnected('GOOGLE_FIT');
    let synced = 0;
    for (const connection of googleFitConnections) {
      try {
        await googleFitService.syncAll(connection.userId);
        synced++;
      } catch (err) {
        console.error(`[Cron] Google Fit sync failed for ${connection.userId}:`, err);
      }
    }

    console.log(`[Cron] Integration sync: Google Fit synced ${synced}/${googleFitConnections.length}`);
    res.json({ ok: true, googleFit: { synced, total: googleFitConnections.length } });
  } catch (error) {
    console.error('[Cron] Integration sync failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

cronRouter.post('/strava-catchup', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    // Re-sync last 24h of activities for all connected Strava users
    // to catch any missed webhook events
    const connections = await integrationRepository.findAllConnected('STRAVA');
    let synced = 0;
    const oneDayAgo = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);

    for (const connection of connections) {
      try {
        const activities = await integrationService.withTokenRefresh(
          connection.userId,
          'STRAVA',
          (token: string) => stravaClient.getActivities(token, { after: oneDayAgo, perPage: 50 }),
          (rt: string) => stravaService.refreshToken(rt)
        );

        for (const activity of activities) {
          await stravaService.syncSingleActivity(connection.userId, activity.id).catch(() => {});
        }

        synced++;
      } catch (err) {
        console.error(`[Cron] Strava catchup failed for ${connection.userId}:`, err);
      }
    }

    console.log(`[Cron] Strava catchup: synced ${synced}/${connections.length}`);
    res.json({ ok: true, strava: { synced, total: connections.length } });
  } catch (error) {
    console.error('[Cron] Strava catchup failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================================================
// REFERRAL CRONS
// =============================================================================

cronRouter.post('/expire-referrals', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const result = await referralService.expireStaleReferrals();
    console.log(`[Cron] Referral expiry: expired=${result.expired}`);
    res.json({ ok: true, ...result });
  } catch (error) {
    console.error('[Cron] Referral expiry failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
