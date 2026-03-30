import type { ReferralStatus } from '@fitnassist/database';
import { prisma } from '../lib/prisma';

export const referralRepository = {
  async create(data: {
    referrerId: string;
    referredUserId: string;
    expiresAt: Date;
  }) {
    return prisma.referral.create({ data });
  },

  async findByReferredUserId(userId: string) {
    return prisma.referral.findUnique({
      where: { referredUserId: userId },
      include: {
        referrer: {
          select: { id: true, handle: true, displayName: true, userId: true },
        },
      },
    });
  },

  async findByReferrerId(
    referrerId: string,
    options: { page?: number; limit?: number; status?: ReferralStatus } = {},
  ) {
    const { page = 1, limit = 20, status } = options;
    const skip = (page - 1) * limit;

    const where = {
      referrerId,
      ...(status ? { status } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.referral.findMany({
        where,
        include: {
          referredUser: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.referral.count({ where }),
    ]);

    return { items, total, page, limit };
  },

  async activate(referralId: string) {
    return prisma.referral.update({
      where: { id: referralId },
      data: {
        status: 'ACTIVATED',
        activatedAt: new Date(),
      },
    });
  },

  async markReferrerRewarded(referralId: string) {
    return prisma.referral.update({
      where: { id: referralId },
      data: { referrerRewardApplied: true },
    });
  },

  async markReferredDiscounted(referralId: string) {
    return prisma.referral.update({
      where: { id: referralId },
      data: { referredDiscountApplied: true },
    });
  },

  async countByReferrer(referrerId: string, status?: ReferralStatus) {
    return prisma.referral.count({
      where: {
        referrerId,
        ...(status ? { status } : {}),
      },
    });
  },

  async findExpiredPending() {
    return prisma.referral.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: new Date() },
      },
    });
  },

  async expirePending(referralId: string) {
    return prisma.referral.update({
      where: { id: referralId },
      data: { status: 'EXPIRED' },
    });
  },
};
