import { Router } from 'express';
import { env } from '../config/env';
import { weeklyReportService } from '../services/weekly-report.service';

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
