import { Router } from 'express';
import { env } from '../config/env';
import { weeklyReportService } from '../services/weekly-report.service';
import { bookingNotificationService } from '../services/booking-notification.service';
import { bookingService } from '../services/booking.service';
import { notificationRepository } from '../repositories/notification.repository';

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
