import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import type { User, Session } from '@fitnassist/database';
import { auth } from './auth';
import { prisma } from './prisma';

export interface Context {
  user: User | null;
  session: Session | null;
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<Context> {
  const sessionData = await auth.api.getSession({
    headers: new Headers(opts.req.headers as Record<string, string>),
  });

  if (!sessionData) {
    return {
      user: null,
      session: null,
    };
  }

  // Better Auth user has different fields than our Prisma User
  // We need to fetch the full user from database or extend Better Auth user
  return {
    user: sessionData.user as unknown as User,
    session: sessionData.session as unknown as Session,
  };
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
