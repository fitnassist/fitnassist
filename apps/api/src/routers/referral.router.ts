import { z } from 'zod';
import { router, trainerProcedure, publicProcedure } from '../lib/trpc';
import { referralService } from '../services/referral.service';
import { referralHistoryInputSchema, referrerInfoInputSchema } from '@fitnassist/schemas';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';

export const referralRouter = router({
  /**
   * Called after registration to link the new user to a referrer.
   * Public because the user hasn't verified their email yet.
   */
  claimReferral: publicProcedure
    .input(z.object({
      referralCode: z.string().min(1),
      userId: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      // Verify the user exists and was recently created (within last 5 minutes)
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { id: true, createdAt: true },
      });

      if (!user) return { success: false };

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (user.createdAt < fiveMinutesAgo) return { success: false };

      await referralService.createReferral(input.referralCode, user.id);
      return { success: true };
    }),

  getStats: trainerProcedure.query(async ({ ctx }) => {
    const trainer = await prisma.trainerProfile.findUnique({
      where: { userId: ctx.user.id },
      select: { id: true },
    });

    if (!trainer) return { total: 0, activated: 0, pending: 0, monthsEarned: 0 };

    return referralService.getReferralStats(trainer.id);
  }),

  getHistory: trainerProcedure
    .input(referralHistoryInputSchema)
    .query(async ({ ctx, input }) => {
      const trainer = await prisma.trainerProfile.findUnique({
        where: { userId: ctx.user.id },
        select: { id: true },
      });

      if (!trainer) return { items: [], total: 0, page: 1, limit: 20 };

      return referralService.getReferralHistory(trainer.id, input);
    }),

  getReferralLink: trainerProcedure.query(async ({ ctx }) => {
    const trainer = await prisma.trainerProfile.findUnique({
      where: { userId: ctx.user.id },
      select: { handle: true },
    });

    if (!trainer) return { url: null, handle: null };

    const baseUrl = env.FRONTEND_URL;
    return {
      url: `${baseUrl}/register?ref=${trainer.handle}`,
      handle: trainer.handle,
    };
  }),

  getReferrerInfo: publicProcedure
    .input(referrerInfoInputSchema)
    .query(async ({ input }) => {
      return referralService.getReferrerInfo(input.handle);
    }),
});
