import { router, publicProcedure } from '../lib/trpc';

export const authRouter = router({
  getSession: publicProcedure.query(async ({ ctx }) => {
    // Session is already resolved in context
    if (!ctx.session || !ctx.user) {
      return null;
    }

    return {
      session: ctx.session,
      user: ctx.user,
    };
  }),
});
