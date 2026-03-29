import { z } from 'zod';
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

  revenueAnalytics: trainerProcedure
    .use(requireTier('ELITE'))
    .query(async ({ ctx }) => {
      return analyticsService.getRevenueAnalytics(ctx.user.id);
    }),

  revenueTransactions: trainerProcedure
    .use(requireTier('ELITE'))
    .input(z.object({
      cursor: z.string().optional(),
      limit: z.number().int().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      return analyticsService.getRevenueTransactions(ctx.user.id, input.cursor, input.limit);
    }),

  productOrderTransactions: trainerProcedure
    .use(requireTier('ELITE'))
    .input(z.object({
      cursor: z.string().optional(),
      limit: z.number().int().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      return analyticsService.getProductOrderTransactions(ctx.user.id, input.cursor, input.limit);
    }),
});
