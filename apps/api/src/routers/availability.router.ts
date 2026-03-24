import { router, trainerProcedure, protectedProcedure, requireTier } from '../lib/trpc';
import { availabilityService } from '../services/availability.service';
import {
  setWeeklyAvailabilitySchema,
  createAvailabilityOverrideSchema,
  deleteAvailabilityOverrideSchema,
  getAvailableSlotsSchema,
  getAvailableDatesSchema,
  updateTravelSettingsSchema,
} from '@fitnassist/schemas';
import { prisma } from '../lib/prisma';

export const availabilityRouter = router({
  // Trainer: get own weekly availability
  getWeekly: trainerProcedure.query(async ({ ctx }) => {
    const trainer = await prisma.trainerProfile.findUnique({
      where: { userId: ctx.user.id },
      select: { id: true },
    });
    if (!trainer) return [];
    return availabilityService.getByTrainerId(trainer.id);
  }),

  // Trainer: replace all weekly availability
  setWeekly: trainerProcedure
    .use(requireTier('PRO'))
    .input(setWeeklyAvailabilitySchema)
    .mutation(async ({ input, ctx }) => {
      const trainer = await prisma.trainerProfile.findUnique({
        where: { userId: ctx.user.id },
        select: { id: true },
      });
      if (!trainer) throw new Error('Trainer profile not found');
      await availabilityService.replaceAll(trainer.id, input.slots);
      return { success: true };
    }),

  // Trainer: get overrides for a date range
  getOverrides: trainerProcedure
    .input(getAvailableDatesSchema.pick({ startDate: true, endDate: true }))
    .query(async ({ input, ctx }) => {
      const trainer = await prisma.trainerProfile.findUnique({
        where: { userId: ctx.user.id },
        select: { id: true },
      });
      if (!trainer) return [];
      return availabilityService.getOverrides(
        trainer.id,
        new Date(input.startDate),
        new Date(input.endDate)
      );
    }),

  // Trainer: create date override
  createOverride: trainerProcedure
    .use(requireTier('PRO'))
    .input(createAvailabilityOverrideSchema)
    .mutation(async ({ input, ctx }) => {
      const trainer = await prisma.trainerProfile.findUnique({
        where: { userId: ctx.user.id },
        select: { id: true },
      });
      if (!trainer) throw new Error('Trainer profile not found');
      return availabilityService.createOverride(trainer.id, {
        ...input,
        date: new Date(input.date),
      });
    }),

  // Trainer: delete date override
  deleteOverride: trainerProcedure
    .use(requireTier('PRO'))
    .input(deleteAvailabilityOverrideSchema)
    .mutation(async ({ input, ctx }) => {
      const trainer = await prisma.trainerProfile.findUnique({
        where: { userId: ctx.user.id },
        select: { id: true },
      });
      if (!trainer) throw new Error('Trainer profile not found');
      return availabilityService.deleteOverride(trainer.id, input.id);
    }),

  // Trainer: update travel settings
  updateTravelSettings: trainerProcedure
    .use(requireTier('PRO'))
    .input(updateTravelSettingsSchema)
    .mutation(async ({ input, ctx }) => {
      return prisma.trainerProfile.update({
        where: { userId: ctx.user.id },
        data: input,
        select: { travelBufferMin: true, smartTravelEnabled: true },
      });
    }),

  // Trainer: get travel settings
  getTravelSettings: trainerProcedure.query(async ({ ctx }) => {
    const trainer = await prisma.trainerProfile.findUnique({
      where: { userId: ctx.user.id },
      select: { travelBufferMin: true, smartTravelEnabled: true },
    });
    return trainer ?? { travelBufferMin: 15, smartTravelEnabled: false };
  }),

  // Public: get available slots for a trainer on a date
  getSlots: protectedProcedure
    .input(getAvailableSlotsSchema)
    .query(async ({ input }) => {
      return availabilityService.getAvailableSlots(
        input.trainerId,
        new Date(input.date),
        input.durationMin
      );
    }),

  // Public: get available dates for a trainer in a range
  getDates: protectedProcedure
    .input(getAvailableDatesSchema)
    .query(async ({ input }) => {
      return availabilityService.getAvailableDates(
        input.trainerId,
        new Date(input.startDate),
        new Date(input.endDate),
        input.durationMin
      );
    }),
});
