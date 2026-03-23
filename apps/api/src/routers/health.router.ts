import { router, publicProcedure } from '../lib/trpc';

export const healthRouter = router({
  check: publicProcedure.query(() => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }),
});
