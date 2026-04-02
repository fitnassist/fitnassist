import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { toNodeHandler } from 'better-auth/node';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './routers';
import { createContext } from './lib/trpc';
import { auth } from './lib/auth';
import { env } from './config/env';
import { prisma } from './lib/prisma';
import { notFoundHandler, errorHandler } from './middleware';
import { sseRouter } from './routes/sse';
import { cronRouter } from './routes/cron';
import { stripeWebhookRouter } from './routes/stripe-webhook';
import { integrationRouter as integrationOAuthRouter } from './routes/integrations';
import { integrationWebhookRouter } from './routes/integration-webhooks';

const app = express();

// Security middleware
app.use(helmet());

// CORS — allow the frontend URL plus any *.SITE_DOMAIN subdomains
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin) return callback(null, true);

    const allowed = [env.FRONTEND_URL];
    const siteDomain = env.SITE_DOMAIN; // e.g. 'fitnassist.co'

    if (
      allowed.includes(origin) ||
      origin.match(new RegExp(`^https?://[a-z0-9-]+\\.${siteDomain.replace(/\./g, '\\.')}$`))
    ) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Better Auth routes (must be before body parsing for proper handling)
// Use regex to match all paths under /api/auth (including /api/auth itself)
app.all(/^\/api\/auth(\/.*)?$/, toNodeHandler(auth));

// Stripe webhook route (needs raw body, must be before express.json())
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookRouter);

// Body parsing
app.use(express.json());

// Health check endpoints (non-tRPC)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/health/detailed', async (_req, res) => {
  const checks: Record<string, { status: 'ok' | 'error'; latencyMs: number; error?: string }> = {};

  // Database
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok', latencyMs: Date.now() - dbStart };
  } catch (e) {
    checks.database = {
      status: 'error',
      latencyMs: Date.now() - dbStart,
      error: e instanceof Error ? e.message : 'Unknown error',
    };
  }

  // Auth
  checks.auth = { status: 'ok', latencyMs: 0 };

  const overall = Object.values(checks).every((c) => c.status === 'ok') ? 'ok' : 'degraded';

  res.status(overall === 'ok' ? 200 : 503).json({
    status: overall,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
  });
});

// SSE endpoint (before tRPC so it's not caught by body parsing issues)
app.use('/api/sse', sseRouter);

// Integration OAuth redirects
app.use('/api/integrations', integrationOAuthRouter);

// Integration webhooks (Strava, Fitbit, Garmin push)
app.use('/api/webhooks', integrationWebhookRouter);

// Cron endpoints (external cron service calls these)
app.use('/api/cron', cronRouter);

// tRPC handler
app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export { app };
