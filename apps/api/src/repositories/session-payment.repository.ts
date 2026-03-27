import { prisma } from '../lib/prisma';
import type { PaymentStatus } from '@fitnassist/database';

export const sessionPaymentRepository = {
  create: (data: {
    bookingId: string;
    stripePaymentIntentId: string;
    amount: number;
    platformFee?: number;
    currency?: string;
    status?: PaymentStatus;
  }) => {
    return prisma.sessionPayment.create({ data });
  },

  findByBookingId: (bookingId: string) => {
    return prisma.sessionPayment.findUnique({
      where: { bookingId },
    });
  },

  findByPaymentIntentId: (stripePaymentIntentId: string) => {
    return prisma.sessionPayment.findUnique({
      where: { stripePaymentIntentId },
    });
  },

  update: (id: string, data: {
    status?: PaymentStatus;
    stripeChargeId?: string;
    refundAmount?: number;
    refundReason?: string;
    refundedAt?: Date;
    paidAt?: Date;
  }) => {
    return prisma.sessionPayment.update({
      where: { id },
      data,
    });
  },
};
