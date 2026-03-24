import { router, trainerProcedure } from '../lib/trpc';
import { subscriptionService } from '../services/subscription.service';
import { createCheckoutSessionSchema } from '@fitnassist/schemas';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';

export const subscriptionRouter = router({
  getCurrent: trainerProcedure.query(async ({ ctx }) => {
    const trainer = await prisma.trainerProfile.findUnique({
      where: { userId: ctx.user.id },
      select: { id: true },
    });

    if (!trainer) return null;

    const [subscription, effectiveTier] = await Promise.all([
      subscriptionService.getCurrentSubscription(trainer.id),
      subscriptionService.getEffectiveTier(trainer.id),
    ]);

    return {
      subscription,
      effectiveTier,
    };
  }),

  createCheckoutSession: trainerProcedure
    .input(createCheckoutSessionSchema)
    .mutation(async ({ ctx, input }) => {
      const trainer = await prisma.trainerProfile.findUnique({
        where: { userId: ctx.user.id },
        select: { id: true },
      });

      if (!trainer) {
        throw new Error('Trainer profile not found');
      }

      return subscriptionService.createCheckoutSession(
        trainer.id,
        input.tier,
        input.billingPeriod,
        env.FRONTEND_URL
      );
    }),

  createPortalSession: trainerProcedure
    .mutation(async ({ ctx }) => {
      const trainer = await prisma.trainerProfile.findUnique({
        where: { userId: ctx.user.id },
        select: { id: true },
      });

      if (!trainer) {
        throw new Error('Trainer profile not found');
      }

      return subscriptionService.createPortalSession(trainer.id, env.FRONTEND_URL);
    }),
});
