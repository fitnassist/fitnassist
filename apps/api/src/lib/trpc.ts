import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import type { User, Session } from '@fitnassist/database';
import { auth } from './auth';
import { prisma } from './prisma';
import type { SubscriptionTier } from '@fitnassist/database';
import { hasTierAccess } from '../config/features';

export interface Context {
  user: User | null;
  session: Session | null;
}

// In-memory session cache to avoid DB lookup on every tRPC call
const SESSION_CACHE_TTL = 60_000; // 1 minute
const sessionCache = new Map<string, { data: { user: User; session: Session }; expires: number }>();

// Clean expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of sessionCache) {
    if (entry.expires < now) sessionCache.delete(key);
  }
}, 60_000);

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<Context> {
  // Extract session token from cookie for cache key
  const cookieHeader = opts.req.headers.cookie || '';
  const tokenMatch = cookieHeader.match(/better-auth\.session_token=([^;]+)/);
  const cacheKey = tokenMatch?.[1];

  // Check cache first
  if (cacheKey) {
    const cached = sessionCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
  }

  const sessionData = await auth.api.getSession({
    headers: new Headers(opts.req.headers as Record<string, string>),
  });

  if (!sessionData) {
    return {
      user: null,
      session: null,
    };
  }

  const result = {
    user: sessionData.user as unknown as User,
    session: sessionData.session as unknown as Session,
  };

  // Cache the session
  if (cacheKey) {
    sessionCache.set(cacheKey, { data: result, expires: Date.now() + SESSION_CACHE_TTL });
  }

  return result;
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof Error
            ? error.cause.message
            : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

const LAST_ACTIVE_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

const isAuthed = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  // Throttled lastActiveAt update — fire and forget
  const lastActive = ctx.user.lastActiveAt;
  if (!lastActive || Date.now() - new Date(lastActive).getTime() > LAST_ACTIVE_THROTTLE_MS) {
    prisma.user.update({
      where: { id: ctx.user.id },
      data: { lastActiveAt: new Date() },
    }).catch(() => {}); // Non-blocking, ignore errors
  }

  return next({
    ctx: {
      user: ctx.user,
      session: ctx.session!,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);

const isTrainer = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }
  if (ctx.user.role !== 'TRAINER' && ctx.user.role !== 'ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You must be a trainer to access this resource',
    });
  }
  return next({
    ctx: {
      user: ctx.user,
      session: ctx.session!,
    },
  });
});

export const trainerProcedure = t.procedure.use(isTrainer);

const isTrainee = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }
  if (ctx.user.role !== 'TRAINEE' && ctx.user.role !== 'ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You must be a trainee to access this resource',
    });
  }
  return next({
    ctx: {
      user: ctx.user,
      session: ctx.session!,
    },
  });
});

export const traineeProcedure = t.procedure.use(isTrainee);

// Tier-gating middleware — must be used after trainerProcedure.
// Inlines the tier check to avoid circular imports with subscription.service.
export const requireTier = (requiredTier: SubscriptionTier) => {
  return middleware(async ({ ctx, next }) => {
    const trainerProfile = await prisma.trainerProfile.findUnique({
      where: { userId: ctx.user!.id },
      select: { id: true },
    });

    if (!trainerProfile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Trainer profile not found',
      });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { trainerId: trainerProfile.id },
    });

    let effectiveTier: SubscriptionTier = 'FREE';
    if (subscription) {
      if (subscription.status === 'TRIALING' && subscription.trialEndDate && new Date() < subscription.trialEndDate) {
        effectiveTier = 'PRO'; // Trial grants PRO access
      } else if (subscription.status === 'ACTIVE' || subscription.status === 'PAST_DUE') {
        effectiveTier = subscription.tier;
      }
    }

    if (!hasTierAccess(effectiveTier, requiredTier)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `This feature requires a ${requiredTier} subscription or higher`,
      });
    }

    return next({
      ctx: {
        user: ctx.user!,
        session: ctx.session!,
      },
    });
  });
};
