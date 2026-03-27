import { TRPCError } from '@trpc/server';
import { getStripe } from '../lib/stripe';
import { prisma } from '../lib/prisma';
import { sessionPaymentRepository } from '../repositories/session-payment.repository';
import { sessionPriceRepository } from '../repositories/session-price.repository';
import { cancellationPolicyRepository } from '../repositories/cancellation-policy.repository';

const PLATFORM_FEE_PENCE = 50; // £0.50

export const sessionPaymentService = {
  /**
   * Create a PaymentIntent for a booking (destination charge to trainer's connected account).
   * Returns the client secret for Stripe Elements on the frontend.
   */
  createPaymentIntent: async (bookingId: string, trainerId: string) => {
    const stripe = getStripe();

    // Get trainer's Stripe account and pricing
    const trainer = await prisma.trainerProfile.findUnique({
      where: { id: trainerId },
      select: {
        stripeConnectedAccountId: true,
        stripeOnboardingComplete: true,
        paymentsEnabled: true,
      },
    });

    if (!trainer?.paymentsEnabled || !trainer.stripeConnectedAccountId || !trainer.stripeOnboardingComplete) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Trainer has not enabled payments' });
    }

    const sessionPrice = await sessionPriceRepository.findByTrainerId(trainerId);
    if (!sessionPrice) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Trainer has not set a session price' });
    }

    // Check for existing payment for this booking
    const existing = await sessionPaymentRepository.findByBookingId(bookingId);
    if (existing) {
      // If there's already a succeeded payment, don't create another
      if (existing.status === 'SUCCEEDED') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Booking already paid' });
      }
      // If pending, return the existing client secret
      if (existing.status === 'PENDING') {
        const pi = await stripe.paymentIntents.retrieve(existing.stripePaymentIntentId);
        return { clientSecret: pi.client_secret!, paymentId: existing.id, amount: existing.amount };
      }
    }

    const amount = sessionPrice.amount;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: sessionPrice.currency,
      application_fee_amount: PLATFORM_FEE_PENCE,
      transfer_data: {
        destination: trainer.stripeConnectedAccountId,
      },
      metadata: {
        bookingId,
        trainerId,
        platform: 'fitnassist',
      },
    });

    const payment = await sessionPaymentRepository.create({
      bookingId,
      stripePaymentIntentId: paymentIntent.id,
      amount,
      platformFee: PLATFORM_FEE_PENCE,
      currency: sessionPrice.currency,
      status: 'PENDING',
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentId: payment.id,
      amount,
    };
  },

  /**
   * Check if this is the trainee's first session with this trainer (for first-session-free).
   */
  isFirstSession: async (trainerId: string, clientRosterId: string): Promise<boolean> => {
    const count = await prisma.booking.count({
      where: {
        trainerId,
        clientRosterId,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
      },
    });
    return count === 0;
  },

  /**
   * Check if payment is required for a booking.
   * Returns pricing info or null if no payment needed.
   */
  getPaymentRequirement: async (trainerId: string, clientRosterId: string) => {
    const trainer = await prisma.trainerProfile.findUnique({
      where: { id: trainerId },
      select: {
        paymentsEnabled: true,
        firstSessionFree: true,
        stripeConnectedAccountId: true,
        stripeOnboardingComplete: true,
      },
    });

    if (!trainer?.paymentsEnabled || !trainer.stripeConnectedAccountId || !trainer.stripeOnboardingComplete) {
      return null;
    }

    const sessionPrice = await sessionPriceRepository.findByTrainerId(trainerId);
    if (!sessionPrice) return null;

    // Check first-session-free
    if (trainer.firstSessionFree) {
      const isFirst = await sessionPaymentService.isFirstSession(trainerId, clientRosterId);
      if (isFirst) {
        return { paymentRequired: false as const, reason: 'first_session_free' as const };
      }
    }

    const cancellationPolicy = await cancellationPolicyRepository.findByTrainerId(trainerId);

    return {
      paymentRequired: true as const,
      amount: sessionPrice.amount,
      currency: sessionPrice.currency,
      cancellationPolicy: cancellationPolicy ? {
        fullRefundHours: cancellationPolicy.fullRefundHours,
        partialRefundHours: cancellationPolicy.partialRefundHours,
        partialRefundPercent: cancellationPolicy.partialRefundPercent,
      } : null,
    };
  },

  /**
   * Calculate refund amount based on cancellation policy.
   */
  calculateRefund: (
    sessionDate: Date,
    sessionStartTime: string,
    policy: { fullRefundHours: number; partialRefundHours: number; partialRefundPercent: number },
    amountPaid: number,
  ): { refundAmount: number; refundPercent: number } => {
    const dateStr = sessionDate instanceof Date
      ? sessionDate.toISOString().split('T')[0]
      : new Date(sessionDate).toISOString().split('T')[0];
    const sessionStart = new Date(`${dateStr}T${sessionStartTime}:00`);
    const hoursUntilSession = (sessionStart.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilSession >= policy.fullRefundHours) {
      return { refundAmount: amountPaid, refundPercent: 100 };
    }
    if (hoursUntilSession >= policy.partialRefundHours) {
      const refund = Math.round(amountPaid * (policy.partialRefundPercent / 100));
      return { refundAmount: refund, refundPercent: policy.partialRefundPercent };
    }
    return { refundAmount: 0, refundPercent: 0 };
  },

  /**
   * Process a full refund (e.g. when trainer declines a booking).
   */
  processDeclineRefund: async (bookingId: string) => {
    const payment = await sessionPaymentRepository.findByBookingId(bookingId);
    if (!payment || payment.status !== 'SUCCEEDED') return null;

    const stripe = getStripe();
    await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      reason: 'requested_by_customer',
    });

    return sessionPaymentRepository.update(payment.id, {
      status: 'REFUNDED',
      refundAmount: payment.amount,
      refundReason: 'Booking declined by trainer',
      refundedAt: new Date(),
    });
  },

  /**
   * Process a cancellation refund based on trainer's cancellation policy.
   */
  processCancellationRefund: async (bookingId: string, cancelledBy: 'trainer' | 'client') => {
    const payment = await sessionPaymentRepository.findByBookingId(bookingId);
    if (!payment || payment.status !== 'SUCCEEDED') return null;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { trainerId: true, date: true, startTime: true },
    });
    if (!booking) return null;

    // Trainer cancellation always gets full refund
    if (cancelledBy === 'trainer') {
      const stripe = getStripe();
      await stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
        reason: 'requested_by_customer',
      });

      return sessionPaymentRepository.update(payment.id, {
        status: 'REFUNDED',
        refundAmount: payment.amount,
        refundReason: 'Cancelled by trainer — full refund',
        refundedAt: new Date(),
      });
    }

    // Client cancellation — check policy
    const policy = await cancellationPolicyRepository.findByTrainerId(booking.trainerId);
    if (!policy) {
      // No policy = full refund
      const stripe = getStripe();
      await stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
        reason: 'requested_by_customer',
      });

      return sessionPaymentRepository.update(payment.id, {
        status: 'REFUNDED',
        refundAmount: payment.amount,
        refundReason: 'No cancellation policy — full refund',
        refundedAt: new Date(),
      });
    }

    const { refundAmount, refundPercent } = sessionPaymentService.calculateRefund(
      booking.date,
      booking.startTime,
      policy,
      payment.amount,
    );

    if (refundAmount === 0) {
      return sessionPaymentRepository.update(payment.id, {
        refundAmount: 0,
        refundReason: `Cancelled <${policy.partialRefundHours}h before session — no refund per policy`,
      });
    }

    const stripe = getStripe();
    await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      amount: refundAmount,
      reason: 'requested_by_customer',
    });

    const isFullRefund = refundPercent === 100;
    return sessionPaymentRepository.update(payment.id, {
      status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
      refundAmount,
      refundReason: `Cancelled ${refundPercent === 100 ? `>${policy.fullRefundHours}h` : `>${policy.partialRefundHours}h`} before session — ${refundPercent}% refund`,
      refundedAt: new Date(),
    });
  },

  /**
   * Get payment status for a booking.
   */
  getPaymentStatus: async (bookingId: string) => {
    const payment = await sessionPaymentRepository.findByBookingId(bookingId);
    if (!payment) return null;

    return {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      refundAmount: payment.refundAmount,
      refundReason: payment.refundReason,
      paidAt: payment.paidAt,
      refundedAt: payment.refundedAt,
    };
  },
};
