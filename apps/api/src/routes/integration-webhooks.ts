import { Router } from 'express';
import { env } from '../config/env';
import { stravaService } from '../services/strava.service';
import { fitbitService } from '../services/fitbit.service';
import { garminService } from '../services/garmin.service';
import { integrationRepository } from '../repositories/integration.repository';
import type { StravaWebhookEvent } from '../lib/strava';

export const integrationWebhookRouter = Router();

// =============================================================================
// STRAVA WEBHOOKS
// =============================================================================

// Webhook validation (Strava sends GET to verify subscription)
integrationWebhookRouter.get('/strava', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
    console.log('[Strava] Webhook subscription validated');
    res.json({ 'hub.challenge': challenge });
  } else {
    res.status(403).json({ error: 'Verification failed' });
  }
});

// Webhook event handler
integrationWebhookRouter.post('/strava', async (req, res) => {
  const event = req.body as StravaWebhookEvent;
  console.log(`[Strava] Webhook event: ${event.object_type} ${event.aspect_type} ${event.object_id}`);

  // Respond immediately, process async
  res.status(200).json({ ok: true });

  try {
    if (event.aspect_type === 'create' || event.aspect_type === 'update') {
      await stravaService.handleWebhookEvent(event);
    } else if (event.object_type === 'athlete' && event.updates && 'authorized' in event.updates && event.updates.authorized === 'false') {
      // Deauthorization event
      const connection = await integrationRepository.findByExternalUserId('STRAVA', String(event.owner_id));
      if (connection) {
        await integrationRepository.disconnect(connection.userId, 'STRAVA');
        console.log(`[Strava] Deauthorized athlete ${event.owner_id}`);
      }
    }
  } catch (error) {
    console.error('[Strava] Webhook processing error:', error);
  }
});

// =============================================================================
// FITBIT WEBHOOKS
// =============================================================================

// Fitbit webhook verification
integrationWebhookRouter.get('/fitbit', (req, res) => {
  const verify = req.query['verify'];
  if (verify === env.FITBIT_WEBHOOK_VERIFY_CODE) {
    res.status(204).send();
  } else {
    res.status(404).send();
  }
});

// Fitbit webhook event handler
integrationWebhookRouter.post('/fitbit', async (req, res) => {
  res.status(204).send();

  try {
    const notifications = req.body as Array<{
      collectionType: string;
      date: string;
      ownerId: string;
      ownerType: string;
      subscriptionId: string;
    }>;

    for (const notification of notifications) {
      await fitbitService.handleWebhookEvent(notification).catch(err =>
        console.error('[Fitbit] Webhook processing error:', err)
      );
    }
  } catch (error) {
    console.error('[Fitbit] Webhook error:', error);
  }
});

// =============================================================================
// GARMIN WEBHOOKS (Push API)
// =============================================================================

integrationWebhookRouter.post('/garmin/activities', async (req, res) => {
  res.status(200).json({ ok: true });

  try {
    const activities = req.body?.activityDetails ?? req.body?.activities ?? [];
    for (const activity of activities) {
      await garminService.handleActivityPush(activity).catch(err =>
        console.error('[Garmin] Activity push error:', err)
      );
    }
  } catch (error) {
    console.error('[Garmin] Activity webhook error:', error);
  }
});

integrationWebhookRouter.post('/garmin/dailies', async (req, res) => {
  res.status(200).json({ ok: true });

  try {
    const dailies = req.body?.dailies ?? [];
    for (const daily of dailies) {
      await garminService.handleDailyPush(daily).catch(err =>
        console.error('[Garmin] Daily push error:', err)
      );
    }
  } catch (error) {
    console.error('[Garmin] Daily webhook error:', error);
  }
});

integrationWebhookRouter.post('/garmin/sleep', async (req, res) => {
  res.status(200).json({ ok: true });

  try {
    const sleeps = req.body?.sleeps ?? [];
    for (const sleep of sleeps) {
      await garminService.handleSleepPush(sleep).catch(err =>
        console.error('[Garmin] Sleep push error:', err)
      );
    }
  } catch (error) {
    console.error('[Garmin] Sleep webhook error:', error);
  }
});

integrationWebhookRouter.post('/garmin/body', async (req, res) => {
  res.status(200).json({ ok: true });

  try {
    const bodyComps = req.body?.bodyComps ?? [];
    for (const body of bodyComps) {
      await garminService.handleBodyPush(body).catch(err =>
        console.error('[Garmin] Body push error:', err)
      );
    }
  } catch (error) {
    console.error('[Garmin] Body webhook error:', error);
  }
});
