import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { toNodeHandler } from 'better-auth/node';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './routers';
import { createContext } from './lib/trpc';
import { auth } from './lib/auth';
import { env } from './config/env';
import { notFoundHandler, errorHandler } from './middleware';
import { sseRouter } from './routes/sse';

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

// Better Auth routes (must be before body parsing for proper handling)
// Use regex to match all paths under /api/auth (including /api/auth itself)
app.all(/^\/api\/auth(\/.*)?$/, toNodeHandler(auth));

// Body parsing
app.use(express.json());

// Health check endpoint (non-tRPC)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SSE endpoint (before tRPC so it's not caught by body parsing issues)
app.use('/api/sse', sseRouter);

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
