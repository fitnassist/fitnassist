import { z } from 'zod';
import { router, trainerProcedure, protectedProcedure, requireTier } from '../lib/trpc';
import { sessionLocationService } from '../services/session-location.service';
import {
  createSessionLocationSchema,
  updateSessionLocationSchema,
  deleteSessionLocationSchema,
} from '@fitnassist/schemas';
import { prisma } from '../lib/prisma';

export const sessionLocationRouter = router({
  // Public endpoint for trainees to see a trainer's locations (for booking)
  listByTrainer: protectedProcedure
    .input(z.object({ trainerId: z.string().cuid() }))
    .query(async ({ input }) => {
      return sessionLocationService.getByTrainerId(input.trainerId);
    }),

  list: trainerProcedure.query(async ({ ctx }) => {
    const trainer = await prisma.trainerProfile.findUnique({
      where: { userId: ctx.user.id },
      select: { id: true },
    });
    if (!trainer) return [];
    return sessionLocationService.getByTrainerId(trainer.id);
  }),

  create: trainerProcedure
    .use(requireTier('PRO'))
    .input(createSessionLocationSchema)
    .mutation(async ({ input, ctx }) => {
      const trainer = await prisma.trainerProfile.findUnique({
        where: { userId: ctx.user.id },
        select: { id: true },
      });
      if (!trainer) throw new Error('Trainer profile not found');
      return sessionLocationService.create(trainer.id, input);
    }),

  update: trainerProcedure
    .use(requireTier('PRO'))
    .input(updateSessionLocationSchema)
    .mutation(async ({ input, ctx }) => {
      const trainer = await prisma.trainerProfile.findUnique({
        where: { userId: ctx.user.id },
        select: { id: true },
      });
      if (!trainer) throw new Error('Trainer profile not found');
      const { id, ...data } = input;
      return sessionLocationService.update(trainer.id, id, data);
    }),

  delete: trainerProcedure
    .use(requireTier('PRO'))
    .input(deleteSessionLocationSchema)
    .mutation(async ({ input, ctx }) => {
      const trainer = await prisma.trainerProfile.findUnique({
        where: { userId: ctx.user.id },
        select: { id: true },
      });
      if (!trainer) throw new Error('Trainer profile not found');
      return sessionLocationService.delete(trainer.id, input.id);
    }),
});
