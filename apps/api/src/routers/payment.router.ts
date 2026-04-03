import {
  router,
  trainerProcedure,
  protectedProcedure,
  requireTier,
} from "../lib/trpc";
import { prisma } from "../lib/prisma";
import { TRPCError } from "@trpc/server";
import { stripeConnectService } from "../services/stripe-connect.service";
import { sessionPaymentService } from "../services/session-payment.service";
import { sessionPriceRepository } from "../repositories/session-price.repository";
import { cancellationPolicyRepository } from "../repositories/cancellation-policy.repository";
import {
  updateSessionPriceSchema,
  updateCancellationPolicySchema,
  updatePaymentSettingsSchema,
} from "@fitnassist/schemas";
import { z } from "zod";

export const paymentRouter = router({
  // Get payment settings (price, policy, toggles, connect status)
  getSettings: trainerProcedure.query(async ({ ctx }) => {
    const trainer = await prisma.trainerProfile.findUnique({
      where: { userId: ctx.user.id },
      select: {
        id: true,
        paymentsEnabled: true,
        firstSessionFree: true,
        stripeConnectedAccountId: true,
        stripeOnboardingComplete: true,
      },
    });
    if (!trainer)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Trainer profile not found",
      });

    const [sessionPrice, cancellationPolicy] = await Promise.all([
      sessionPriceRepository.findByTrainerId(trainer.id),
      cancellationPolicyRepository.findByTrainerId(trainer.id),
    ]);

    return {
      paymentsEnabled: trainer.paymentsEnabled,
      firstSessionFree: trainer.firstSessionFree,
      stripeConnectedAccountId: !!trainer.stripeConnectedAccountId,
      stripeOnboardingComplete: trainer.stripeOnboardingComplete,
      sessionPrice: sessionPrice
        ? { amount: sessionPrice.amount, currency: sessionPrice.currency }
        : null,
      cancellationPolicy: cancellationPolicy
        ? {
            fullRefundHours: cancellationPolicy.fullRefundHours,
            partialRefundHours: cancellationPolicy.partialRefundHours,
            partialRefundPercent: cancellationPolicy.partialRefundPercent,
          }
        : null,
    };
  }),

  // Update session price
  updateSessionPrice: trainerProcedure
    .use(requireTier("ELITE"))
    .input(updateSessionPriceSchema)
    .mutation(async ({ input, ctx }) => {
      const trainer = await prisma.trainerProfile.findUnique({
        where: { userId: ctx.user.id },
        select: { id: true },
      });
      if (!trainer)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trainer profile not found",
        });
      return sessionPriceRepository.upsert(
        trainer.id,
        input.amount,
        input.currency,
      );
    }),

  // Update cancellation policy
  updateCancellationPolicy: trainerProcedure
    .use(requireTier("ELITE"))
    .input(updateCancellationPolicySchema)
    .mutation(async ({ input, ctx }) => {
      if (input.partialRefundHours >= input.fullRefundHours) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Partial refund window must be less than full refund window",
        });
      }
      const trainer = await prisma.trainerProfile.findUnique({
        where: { userId: ctx.user.id },
        select: { id: true },
      });
      if (!trainer)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trainer profile not found",
        });
      return cancellationPolicyRepository.upsert(trainer.id, input);
    }),

  // Update payment toggles (paymentsEnabled, firstSessionFree)
  updateSettings: trainerProcedure
    .use(requireTier("ELITE"))
    .input(updatePaymentSettingsSchema)
    .mutation(async ({ input, ctx }) => {
      const trainer = await prisma.trainerProfile.findUnique({
        where: { userId: ctx.user.id },
        select: { id: true, stripeOnboardingComplete: true },
      });
      if (!trainer)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trainer profile not found",
        });

      // Can't enable payments without completing Stripe onboarding
      if (input.paymentsEnabled && !trainer.stripeOnboardingComplete) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Complete Stripe onboarding before enabling payments",
        });
      }

      return prisma.trainerProfile.update({
        where: { id: trainer.id },
        data: input,
        select: { paymentsEnabled: true, firstSessionFree: true },
      });
    }),

  // Start Stripe Connect onboarding — creates account if needed, returns onboarding URL
  createOnboardingLink: trainerProcedure
    .use(requireTier("ELITE"))
    .mutation(async ({ ctx }) => {
      const trainer = await prisma.trainerProfile.findUnique({
        where: { userId: ctx.user.id },
        include: { user: { select: { email: true } } },
      });
      if (!trainer)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trainer profile not found",
        });

      let accountId = trainer.stripeConnectedAccountId as string | null;

      // Create account if it doesn't exist
      if (!accountId) {
        accountId = await stripeConnectService.createConnectedAccount(
          trainer.user.email,
        );
        await prisma.trainerProfile.update({
          where: { id: trainer.id },
          data: { stripeConnectedAccountId: accountId },
        });
      }

      const url = await stripeConnectService.createOnboardingLink(accountId);
      return { url };
    }),

  // Check Stripe Connect account status (call after returning from onboarding)
  refreshConnectStatus: trainerProcedure
    .use(requireTier("ELITE"))
    .mutation(async ({ ctx }) => {
      const trainer = await prisma.trainerProfile.findUnique({
        where: { userId: ctx.user.id },
        select: { id: true, stripeConnectedAccountId: true },
      });
      if (!trainer?.stripeConnectedAccountId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No Stripe account linked",
        });
      }

      const status = await stripeConnectService.getAccountStatus(
        trainer.stripeConnectedAccountId,
      );
      const isComplete = status.chargesEnabled && status.detailsSubmitted;

      await prisma.trainerProfile.update({
        where: { id: trainer.id },
        data: { stripeOnboardingComplete: isComplete },
      });

      return { ...status, onboardingComplete: isComplete };
    }),

  // Get Stripe Express dashboard link (for managing payouts)
  getDashboardLink: trainerProcedure
    .use(requireTier("ELITE"))
    .mutation(async ({ ctx }) => {
      const trainer = await prisma.trainerProfile.findUnique({
        where: { userId: ctx.user.id },
        select: {
          stripeConnectedAccountId: true,
          stripeOnboardingComplete: true,
        },
      });
      if (
        !trainer?.stripeConnectedAccountId ||
        !trainer.stripeOnboardingComplete
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Stripe onboarding not complete",
        });
      }

      const url = await stripeConnectService.getDashboardUrl();
      return { url };
    }),

  // Public: get trainer's pricing info (for booking flow)
  getTrainerPricing: protectedProcedure
    .input(z.object({ trainerId: z.string().cuid() }))
    .query(async ({ input }) => {
      const trainer = await prisma.trainerProfile.findUnique({
        where: { id: input.trainerId },
        select: {
          paymentsEnabled: true,
          firstSessionFree: true,
        },
      });
      if (!trainer) return null;
      if (!trainer.paymentsEnabled) return null;

      const [sessionPrice, cancellationPolicy] = await Promise.all([
        sessionPriceRepository.findByTrainerId(input.trainerId),
        cancellationPolicyRepository.findByTrainerId(input.trainerId),
      ]);

      return {
        amount: sessionPrice?.amount ?? 0,
        currency: sessionPrice?.currency ?? "gbp",
        firstSessionFree: trainer.firstSessionFree,
        cancellationPolicy: cancellationPolicy
          ? {
              fullRefundHours: cancellationPolicy.fullRefundHours,
              partialRefundHours: cancellationPolicy.partialRefundHours,
              partialRefundPercent: cancellationPolicy.partialRefundPercent,
            }
          : null,
      };
    }),

  // Create Checkout Session for a booking (mobile-friendly alternative to PaymentIntent)
  createBookingCheckoutSession: protectedProcedure
    .input(
      z.object({
        bookingId: z.string().cuid(),
        successUrl: z.string().url().optional(),
        cancelUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return sessionPaymentService.createCheckoutSession(
        input.bookingId,
        ctx.user.id,
        input.successUrl,
        input.cancelUrl,
      );
    }),

  // Create PaymentIntent for a booking
  createPaymentIntent: protectedProcedure
    .input(z.object({ bookingId: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      const booking = await prisma.booking.findUnique({
        where: { id: input.bookingId },
        select: {
          id: true,
          trainerId: true,
          status: true,
          clientRoster: {
            select: { connection: { select: { senderId: true } } },
          },
        },
      });
      if (!booking)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Booking not found",
        });

      // Only the client (trainee) can pay
      const isClient = booking.clientRoster.connection.senderId === ctx.user.id;
      if (!isClient)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the client can pay",
        });

      return sessionPaymentService.createPaymentIntent(
        booking.id,
        booking.trainerId,
      );
    }),

  // Get payment status for a booking
  getPaymentStatus: protectedProcedure
    .input(z.object({ bookingId: z.string().cuid() }))
    .query(async ({ input }) => {
      return sessionPaymentService.getPaymentStatus(input.bookingId);
    }),

  // Check if payment is required for a booking (used before creating booking)
  getPaymentRequirement: protectedProcedure
    .input(
      z.object({
        trainerId: z.string().cuid(),
        clientRosterId: z.string().cuid(),
        sessionType: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      return sessionPaymentService.getPaymentRequirement(
        input.trainerId,
        input.clientRosterId,
        input.sessionType,
      );
    }),
});
