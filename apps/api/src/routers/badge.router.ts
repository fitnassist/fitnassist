import { z } from 'zod';
import { router, protectedProcedure } from '../lib/trpc';
import { badgeService } from '../services/badge.service';

export const badgeRouter = router({
  getUserBadges: protectedProcedure
    .input(z.object({ userId: z.string().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const userId = input?.userId ?? ctx.user.id;
      return badgeService.getUserBadges(userId);
    }),

  getShowcaseBadges: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return badgeService.getShowcaseBadges(input.userId);
    }),

  setShowcaseBadges: protectedProcedure
    .input(z.object({ badgeIds: z.array(z.string()).max(5) }))
    .mutation(async ({ input, ctx }) => {
      return badgeService.setShowcaseBadges(ctx.user.id, input.badgeIds);
    }),

  getMyShowcaseBadgeIds: protectedProcedure
    .query(async ({ ctx }) => {
      return badgeService.getShowcaseBadgeIds(ctx.user.id);
    }),

  getAllBadgeDefinitions: protectedProcedure
    .query(async () => {
      return badgeService.getAllBadgeDefinitions();
    }),
});
