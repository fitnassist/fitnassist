import { Router } from 'express';
import { env } from '../config/env';
import { stravaService } from '../services/strava.service';
import { googleFitService } from '../services/google-fit.service';
import { fitbitService } from '../services/fitbit.service';
import { garminService } from '../services/garmin.service';
import { auth } from '../lib/auth';

export const integrationRouter = Router();

/**
 * Helper to extract the authenticated userId from the request.
 * Uses Better Auth session cookie.
 */
const getSessionUserId = async (req: import('express').Request): Promise<string | null> => {
  try {
    const session = await auth.api.getSession({
      headers: new Headers(req.headers as Record<string, string>),
    });
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
};

// =============================================================================
// STRAVA
// =============================================================================

integrationRouter.get('/strava/auth', async (req, res) => {
  if (!env.STRAVA_CLIENT_ID || !env.STRAVA_CLIENT_SECRET) {
    res.status(404).json({ error: 'Strava integration not configured' });
    return;
  }

  const userId = await getSessionUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const authUrl = stravaService.getAuthUrl(userId);
  res.redirect(authUrl);
});

integrationRouter.get('/strava/callback', async (req, res) => {
  if (!env.STRAVA_CLIENT_ID || !env.STRAVA_CLIENT_SECRET) {
    res.status(404).json({ error: 'Strava integration not configured' });
    return;
  }

  const { code, state: userId } = req.query;
  if (!code || !userId || typeof code !== 'string' || typeof userId !== 'string') {
    res.redirect(`${env.FRONTEND_URL}/dashboard/settings?tab=integrations&error=invalid_callback`);
    return;
  }

  try {
    await stravaService.exchangeToken(code, userId);
    res.redirect(`${env.FRONTEND_URL}/dashboard/settings?tab=integrations&connected=strava`);
  } catch (error) {
    console.error('[Strava] OAuth callback error:', error);
    res.redirect(`${env.FRONTEND_URL}/dashboard/settings?tab=integrations&error=strava_auth_failed`);
  }
});

// =============================================================================
// GOOGLE FIT
// =============================================================================

integrationRouter.get('/google-fit/auth', async (req, res) => {
  if (!env.GOOGLE_FIT_CLIENT_ID || !env.GOOGLE_FIT_CLIENT_SECRET) {
    res.status(404).json({ error: 'Google Fit integration not configured' });
    return;
  }

  const userId = await getSessionUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const authUrl = googleFitService.getAuthUrl(userId);
  res.redirect(authUrl);
});

integrationRouter.get('/google-fit/callback', async (req, res) => {
  if (!env.GOOGLE_FIT_CLIENT_ID || !env.GOOGLE_FIT_CLIENT_SECRET) {
    res.status(404).json({ error: 'Google Fit integration not configured' });
    return;
  }

  const { code, state: userId } = req.query;
  if (!code || !userId || typeof code !== 'string' || typeof userId !== 'string') {
    res.redirect(`${env.FRONTEND_URL}/dashboard/settings?tab=integrations&error=invalid_callback`);
    return;
  }

  try {
    await googleFitService.exchangeToken(code, userId);
    res.redirect(`${env.FRONTEND_URL}/dashboard/settings?tab=integrations&connected=google_fit`);
  } catch (error) {
    console.error('[Google Fit] OAuth callback error:', error);
    res.redirect(`${env.FRONTEND_URL}/dashboard/settings?tab=integrations&error=google_fit_auth_failed`);
  }
});

// =============================================================================
// FITBIT
// =============================================================================

integrationRouter.get('/fitbit/auth', async (req, res) => {
  if (!env.FITBIT_CLIENT_ID || !env.FITBIT_CLIENT_SECRET) {
    res.status(404).json({ error: 'Fitbit integration not configured' });
    return;
  }

  const userId = await getSessionUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const authUrl = fitbitService.getAuthUrl(userId);
  res.redirect(authUrl);
});

integrationRouter.get('/fitbit/callback', async (req, res) => {
  if (!env.FITBIT_CLIENT_ID || !env.FITBIT_CLIENT_SECRET) {
    res.status(404).json({ error: 'Fitbit integration not configured' });
    return;
  }

  const { code, state: userId } = req.query;
  if (!code || !userId || typeof code !== 'string' || typeof userId !== 'string') {
    res.redirect(`${env.FRONTEND_URL}/dashboard/settings?tab=integrations&error=invalid_callback`);
    return;
  }

  try {
    await fitbitService.exchangeToken(code, userId);
    res.redirect(`${env.FRONTEND_URL}/dashboard/settings?tab=integrations&connected=fitbit`);
  } catch (error) {
    console.error('[Fitbit] OAuth callback error:', error);
    res.redirect(`${env.FRONTEND_URL}/dashboard/settings?tab=integrations&error=fitbit_auth_failed`);
  }
});

// =============================================================================
// GARMIN
// =============================================================================

integrationRouter.get('/garmin/auth', async (req, res) => {
  if (!env.GARMIN_CONSUMER_KEY || !env.GARMIN_CONSUMER_SECRET) {
    res.status(404).json({ error: 'Garmin integration not configured' });
    return;
  }

  const userId = await getSessionUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const authUrl = await garminService.getAuthUrl(userId);
    res.redirect(authUrl);
  } catch (error) {
    console.error('[Garmin] OAuth auth error:', error);
    res.redirect(`${env.FRONTEND_URL}/dashboard/settings?tab=integrations&error=garmin_auth_failed`);
  }
});

integrationRouter.get('/garmin/callback', async (req, res) => {
  if (!env.GARMIN_CONSUMER_KEY || !env.GARMIN_CONSUMER_SECRET) {
    res.status(404).json({ error: 'Garmin integration not configured' });
    return;
  }

  const { oauth_token, oauth_verifier } = req.query;
  if (!oauth_token || !oauth_verifier || typeof oauth_token !== 'string' || typeof oauth_verifier !== 'string') {
    res.redirect(`${env.FRONTEND_URL}/dashboard/settings?tab=integrations&error=invalid_callback`);
    return;
  }

  try {
    await garminService.exchangeToken(oauth_token, oauth_verifier);
    res.redirect(`${env.FRONTEND_URL}/dashboard/settings?tab=integrations&connected=garmin`);
  } catch (error) {
    console.error('[Garmin] OAuth callback error:', error);
    res.redirect(`${env.FRONTEND_URL}/dashboard/settings?tab=integrations&error=garmin_auth_failed`);
  }
});
