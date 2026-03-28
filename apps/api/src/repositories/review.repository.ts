import { prisma } from '../lib/prisma';
import type { Prisma, ReportReason } from '@fitnassist/database';

const reviewInclude = {
  reviewer: {
    select: {
      id: true,
      name: true,
      image: true,
    },
  },
} satisfies Prisma.ReviewInclude;

export const reviewRepository = {
  async findByTrainerId(trainerId: string, cursor?: string, limit = 10) {
    return prisma.review.findMany({
      where: { trainerId },
      include: reviewInclude,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  },

  async findByTrainerAndReviewer(trainerId: string, reviewerId: string) {
    return prisma.review.findUnique({
      where: { trainerId_reviewerId: { trainerId, reviewerId } },
      include: reviewInclude,
    });
  },

  async findById(id: string) {
    return prisma.review.findUnique({
      where: { id },
      include: reviewInclude,
    });
  },

  async create(data: {
    trainerId: string;
    reviewerId: string;
    rating: number;
    text: string;
  }) {
    return prisma.review.create({
      data,
      include: reviewInclude,
    });
  },

  async update(id: string, data: { rating: number; text: string }) {
    return prisma.review.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
      include: reviewInclude,
    });
  },

  async updateReply(id: string, replyText: string) {
    return prisma.review.update({
      where: { id },
      data: { replyText, repliedAt: new Date() },
      include: reviewInclude,
    });
  },

  async getAggregate(trainerId: string) {
    const result = await prisma.review.aggregate({
      where: { trainerId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    return {
      average: result._avg.rating ?? 0,
      count: result._count.rating,
    };
  },

  async createReport(data: {
    reviewId: string;
    reporterId: string;
    reason: ReportReason;
    details?: string;
  }) {
    return prisma.reviewReport.create({ data });
  },

  async findReportByReviewAndReporter(reviewId: string, reporterId: string) {
    return prisma.reviewReport.findUnique({
      where: { reviewId_reporterId: { reviewId, reporterId } },
    });
  },
};
