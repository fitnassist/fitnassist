import { prisma } from '../lib/prisma';
import type { OrderStatus } from '@fitnassist/database';

export const productOrderRepository = {
  async create(data: {
    buyerUserId: string;
    trainerId: string;
    stripePaymentIntentId?: string;
    subtotalPence: number;
    discountPence?: number;
    totalPence: number;
    platformFeePence: number;
    couponId?: string;
    couponCode?: string;
    shippingName?: string;
    shippingAddress?: string;
    items: Array<{
      productId: string;
      productName: string;
      pricePence: number;
      quantity: number;
    }>;
  }) {
    const { items, ...orderData } = data;
    return prisma.productOrder.create({
      data: {
        ...orderData,
        items: {
          create: items,
        },
      },
      include: { items: true },
    });
  },

  async findById(id: string) {
    return prisma.productOrder.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        buyer: { select: { id: true, name: true, email: true } },
        coupon: true,
      },
    });
  },

  async findByPaymentIntentId(paymentIntentId: string) {
    return prisma.productOrder.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
      include: {
        items: { include: { product: true } },
        buyer: { select: { id: true, name: true, email: true } },
      },
    });
  },

  async findByBuyer(
    userId: string,
    options: { cursor?: string; limit?: number } = {},
  ) {
    const { cursor, limit = 20 } = options;
    return prisma.productOrder.findMany({
      where: { buyerUserId: userId },
      include: {
        items: { include: { product: { select: { id: true, name: true, type: true, imageUrl: true } } } },
        trainer: { select: { id: true, displayName: true, handle: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  },

  async findByTrainer(
    trainerId: string,
    options: { cursor?: string; limit?: number; status?: OrderStatus } = {},
  ) {
    const { cursor, limit = 20, status } = options;
    return prisma.productOrder.findMany({
      where: {
        trainerId,
        ...(status ? { status } : {}),
      },
      include: {
        items: { include: { product: { select: { id: true, name: true, imageUrl: true } } } },
        buyer: { select: { id: true, name: true, email: true } },
        coupon: { select: { code: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  },

  async updateStatus(id: string, status: OrderStatus, extra?: { paidAt?: Date; refundAmount?: number; refundReason?: string; refundedAt?: Date; stripeChargeId?: string }) {
    return prisma.productOrder.update({
      where: { id },
      data: { status, ...extra },
    });
  },

  async countByTrainer(trainerId: string, status?: OrderStatus) {
    return prisma.productOrder.count({
      where: { trainerId, ...(status ? { status } : {}) },
    });
  },
};
