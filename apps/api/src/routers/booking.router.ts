import { z } from 'zod';
import { router, protectedProcedure, trainerProcedure, requireTier } from '../lib/trpc';
import { bookingService } from '../services/booking.service';
import {
  createBookingSchema,
  cancelBookingSchema,
  getBookingSchema,
  listTrainerBookingsSchema,
  completeBookingSchema,
  noShowBookingSchema,
} from '@fitnassist/schemas';
import { prisma } from '../lib/prisma';

export const bookingRouter = router({
  // Get a single booking (trainer or client)
  get: protectedProcedure
    .input(getBookingSchema)
    .query(async ({ input, ctx }) => {
      return bookingService.getById(input.id, ctx.user.id);
    }),

  // Trainer: list bookings in date range
  listByDateRange: trainerProcedure
    .input(listTrainerBookingsSchema)
    .query(async ({ input, ctx }) => {
      const trainer = await prisma.trainerProfile.findUnique({
        where: { userId: ctx.user.id },
        select: { id: true },
      });
      if (!trainer) return [];
      return bookingService.getByTrainerDateRange(
        trainer.id,
        new Date(input.startDate),
        new Date(input.endDate),
        input.status
      );
    }),

  // Any authenticated user: get upcoming bookings
  upcoming: protectedProcedure.query(async ({ ctx }) => {
    return bookingService.getUpcomingByUserId(ctx.user.id);
  }),

  // Client: list bookings for a specific client roster entry
  listByClientRoster: protectedProcedure
    .input(z.object({ clientRosterId: z.string().cuid() }))
    .query(async ({ input }) => {
      return bookingService.getByClientRosterId(input.clientRosterId);
    }),

  // Create a booking (client or trainer on behalf of client)
  create: protectedProcedure
    .input(createBookingSchema)
    .mutation(async ({ input }) => {
      return bookingService.create({
        ...input,
        date: new Date(input.date),
      });
    }),

  // Cancel a booking (trainer or client)
  cancel: protectedProcedure
    .input(cancelBookingSchema)
    .mutation(async ({ input, ctx }) => {
      return bookingService.cancel(input.id, ctx.user.id, input.reason);
    }),

  // Trainer: mark booking as completed
  complete: trainerProcedure
    .use(requireTier('PRO'))
    .input(completeBookingSchema)
    .mutation(async ({ input, ctx }) => {
      const trainer = await prisma.trainerProfile.findUnique({
        where: { userId: ctx.user.id },
        select: { id: true },
      });
      if (!trainer) throw new Error('Trainer profile not found');
      return bookingService.complete(input.id, trainer.id);
    }),

  // Trainer: mark booking as no-show
  noShow: trainerProcedure
    .use(requireTier('PRO'))
    .input(noShowBookingSchema)
    .mutation(async ({ input, ctx }) => {
      const trainer = await prisma.trainerProfile.findUnique({
        where: { userId: ctx.user.id },
        select: { id: true },
      });
      if (!trainer) throw new Error('Trainer profile not found');
      return bookingService.markNoShow(input.id, trainer.id);
    }),
});
