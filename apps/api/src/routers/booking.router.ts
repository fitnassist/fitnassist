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
  confirmBookingSchema,
  declineBookingSchema,
  rescheduleBookingSchema,
  suggestAlternativeSchema,
  respondToSuggestionSchema,
  createBookingForClientSchema,
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

  // Create a booking (client-initiated — trainer must confirm)
  create: protectedProcedure
    .input(createBookingSchema)
    .mutation(async ({ input, ctx }) => {
      return bookingService.create({
        ...input,
        date: new Date(input.date),
        initiatedBy: ctx.user.id,
      });
    }),

  // Trainer: create a booking for a client (client must confirm)
  createForClient: trainerProcedure
    .input(createBookingForClientSchema)
    .mutation(async ({ input, ctx }) => {
      const trainer = await prisma.trainerProfile.findUnique({
        where: { userId: ctx.user.id },
        select: { id: true },
      });
      if (!trainer) throw new Error('Trainer profile not found');
      return bookingService.create({
        ...input,
        trainerId: trainer.id,
        date: new Date(input.date),
        initiatedBy: ctx.user.id,
      });
    }),

  // Confirm a pending booking
  confirm: protectedProcedure
    .input(confirmBookingSchema)
    .mutation(async ({ input, ctx }) => {
      return bookingService.confirm(input.id, ctx.user.id);
    }),

  // Decline a pending booking
  decline: protectedProcedure
    .input(declineBookingSchema)
    .mutation(async ({ input, ctx }) => {
      return bookingService.decline(input.id, ctx.user.id, input.reason);
    }),

  // Reschedule a booking
  reschedule: protectedProcedure
    .input(rescheduleBookingSchema)
    .mutation(async ({ input, ctx }) => {
      return bookingService.reschedule(
        input.id,
        ctx.user.id,
        new Date(input.date),
        input.startTime,
        input.durationMin
      );
    }),

  // Suggest alternative times for a pending booking
  suggestAlternative: protectedProcedure
    .input(suggestAlternativeSchema)
    .mutation(async ({ input, ctx }) => {
      return bookingService.suggestAlternative(input.bookingId, ctx.user.id, input.suggestions);
    }),

  // Respond to a suggestion (accept or decline)
  respondToSuggestion: protectedProcedure
    .input(respondToSuggestionSchema)
    .mutation(async ({ input, ctx }) => {
      return bookingService.respondToSuggestion(input.suggestionId, ctx.user.id, input.accept);
    }),

  // Get suggestions for a booking
  getSuggestions: protectedProcedure
    .input(z.object({ bookingId: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      return bookingService.getSuggestions(input.bookingId, ctx.user.id);
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
