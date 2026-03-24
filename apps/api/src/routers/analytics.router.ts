import { router, trainerProcedure, requireTier } from '../lib/trpc';
import { analyticsService } from '../services/analytics.service';

export const analyticsRouter = router({
  profileViewTrend: trainerProcedure
    .use(requireTier('ELITE'))
    .query(async ({ ctx }) => {
      return analyticsService.getProfileViewTrend(ctx.user.id);
    }),

  bookingAnalytics: trainerProcedure
    .use(requireTier('ELITE'))
    .query(async ({ ctx }) => {
      return analyticsService.getBookingAnalytics(ctx.user.id);
    }),

  clientAdherence: trainerProcedure
    .use(requireTier('ELITE'))
    .query(async ({ ctx }) => {
      return analyticsService.getClientAdherence(ctx.user.id);
    }),

  goalAnalytics: trainerProcedure
    .use(requireTier('ELITE'))
    .query(async ({ ctx }) => {
      return analyticsService.getGoalAnalytics(ctx.user.id);
    }),
});
