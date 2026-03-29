import { TRPCError } from '@trpc/server';
import { analyticsRepository } from '../repositories/analytics.repository';
import { trainerRepository } from '../repositories/trainer.repository';
import { clientRosterRepository } from '../repositories/client-roster.repository';

export const analyticsService = {
  async getDashboardStats(userId: string) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Trainer profile not found',
      });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [views30Days, clientCounts, bookingSummary] = await Promise.all([
      trainerRepository.getProfileViewCount(trainer.id, thirtyDaysAgo),
      clientRosterRepository.getCountsByStatus(trainer.id),
      analyticsRepository.getBookingSummary(trainer.id),
    ]);

    return {
      profileViews30d: views30Days,
      activeClients: clientCounts.active,
      bookings30d: bookingSummary.totalThisMonth,
      completionRate: bookingSummary.completionRate,
    };
  },

  async getProfileViewTrend(userId: string) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Trainer profile not found',
      });
    }

    return analyticsRepository.getProfileViewTrend(trainer.id);
  },

  async getBookingAnalytics(userId: string) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Trainer profile not found',
      });
    }

    return analyticsRepository.getBookingAnalytics(trainer.id);
  },

  async getClientAdherence(userId: string) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Trainer profile not found',
      });
    }

    return analyticsRepository.getClientAdherence(trainer.id);
  },

  async getRevenueAnalytics(userId: string) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Trainer profile not found',
      });
    }

    return analyticsRepository.getRevenueAnalytics(trainer.id);
  },

  async getRevenueTransactions(userId: string, cursor?: string, limit?: number) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Trainer profile not found',
      });
    }

    return analyticsRepository.getRevenueTransactions(trainer.id, cursor, limit);
  },

  async getProductOrderTransactions(userId: string, cursor?: string, limit?: number) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Trainer profile not found',
      });
    }

    return analyticsRepository.getProductOrderTransactions(trainer.id, cursor, limit);
  },

  async getGoalAnalytics(userId: string) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Trainer profile not found',
      });
    }

    return analyticsRepository.getGoalAnalytics(trainer.id);
  },
};
