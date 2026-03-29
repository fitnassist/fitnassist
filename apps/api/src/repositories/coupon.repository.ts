import { prisma } from '../lib/prisma';

export const couponRepository = {
  async findByTrainerId(
    trainerId: string,
    options: { activeOnly?: boolean; cursor?: string; limit?: number } = {},
  ) {
    const { activeOnly, cursor, limit = 50 } = options;
    return prisma.coupon.findMany({
      where: {
        trainerId,
        ...(activeOnly ? { isActive: true } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  },

  async findByCode(trainerId: string, code: string) {
    return prisma.coupon.findUnique({
      where: { trainerId_code: { trainerId, code: code.toUpperCase() } },
    });
  },

  async findById(id: string) {
    return prisma.coupon.findUnique({ where: { id } });
  },

  async create(data: {
    trainerId: string;
    code: string;
    stripeCouponId: string;
    stripePromotionCodeId?: string;
    description?: string;
    percentOff?: number;
    amountOffPence?: number;
    minOrderPence?: number;
    maxRedemptions?: number;
    expiresAt?: Date;
  }) {
    return prisma.coupon.create({ data });
  },

  async update(
    id: string,
    data: {
      description?: string;
      isActive?: boolean;
      maxRedemptions?: number | null;
      expiresAt?: Date | null;
    },
  ) {
    return prisma.coupon.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.coupon.update({
      where: { id },
      data: { isActive: false },
    });
  },

  async incrementRedemptions(id: string) {
    return prisma.coupon.update({
      where: { id },
      data: { currentRedemptions: { increment: 1 } },
    });
  },

  async countByTrainerId(trainerId: string) {
    return prisma.coupon.count({ where: { trainerId } });
  },
};
