import { TRPCError } from '@trpc/server';
import type { ReportReason } from '@fitnassist/database';
import { prisma } from '../lib/prisma';
import { reviewRepository } from '../repositories/review.repository';
import { inAppNotificationService } from './in-app-notification.service';

const recalculateRatingCache = async (trainerId: string) => {
  const { average, count } = await reviewRepository.getAggregate(trainerId);
  await prisma.trainerProfile.update({
    where: { id: trainerId },
    data: {
      ratingAverage: Math.round(average * 10) / 10,
      ratingCount: count,
    },
  });
};

export const reviewService = {
  async checkEligibility(trainerId: string, userId: string) {
    // Check if user has at least one completed booking with this trainer
    const completedCount = await prisma.booking.count({
      where: {
        trainerId,
        status: 'COMPLETED',
        clientRoster: {
          connection: {
            senderId: userId,
          },
        },
      },
    });

    const existingReview = await reviewRepository.findByTrainerAndReviewer(trainerId, userId);

    return {
      eligible: completedCount > 0,
      existingReview,
    };
  },

  async create(trainerId: string, reviewerId: string, rating: number, text: string) {
    // Verify eligibility
    const { eligible, existingReview } = await this.checkEligibility(trainerId, reviewerId);

    if (!eligible) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You must have at least one completed session to leave a review',
      });
    }

    if (existingReview) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'You have already reviewed this trainer',
      });
    }

    const review = await reviewRepository.create({ trainerId, reviewerId, rating, text });

    // Recalculate cached rating
    await recalculateRatingCache(trainerId);

    // Notify trainer
    const trainerProfile = await prisma.trainerProfile.findUnique({
      where: { id: trainerId },
      select: { userId: true, displayName: true },
    });

    if (trainerProfile) {
      inAppNotificationService.notify({
        userId: trainerProfile.userId,
        type: 'REVIEW_RECEIVED',
        title: `${review.reviewer.name} left you a ${rating}-star review`,
        link: '/dashboard/reviews',
      }).catch(console.error);
    }

    return review;
  },

  async update(reviewId: string, userId: string, rating: number, text: string) {
    const review = await reviewRepository.findById(reviewId);

    if (!review) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Review not found' });
    }

    if (review.reviewerId !== userId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only edit your own review' });
    }

    const updated = await reviewRepository.update(reviewId, { rating, text });

    // Recalculate cached rating
    await recalculateRatingCache(review.trainerId);

    return updated;
  },

  async reply(reviewId: string, userId: string, replyText: string) {
    const review = await reviewRepository.findById(reviewId);

    if (!review) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Review not found' });
    }

    // Verify trainer owns the review's trainer profile
    const trainerProfile = await prisma.trainerProfile.findUnique({
      where: { id: review.trainerId },
      select: { userId: true, displayName: true, handle: true },
    });

    if (!trainerProfile || trainerProfile.userId !== userId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the trainer can reply to this review' });
    }

    if (review.replyText) {
      throw new TRPCError({ code: 'CONFLICT', message: 'You have already replied to this review' });
    }

    const updated = await reviewRepository.updateReply(reviewId, replyText);

    // Notify reviewer
    inAppNotificationService.notify({
      userId: review.reviewerId,
      type: 'REVIEW_REPLY',
      title: `${trainerProfile.displayName} replied to your review`,
      link: `/trainers/${trainerProfile.handle}`,
    }).catch(console.error);

    return updated;
  },

  async report(reviewId: string, reporterId: string, reason: ReportReason, details?: string) {
    const review = await reviewRepository.findById(reviewId);

    if (!review) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Review not found' });
    }

    if (review.reviewerId === reporterId) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'You cannot report your own review' });
    }

    const existingReport = await reviewRepository.findReportByReviewAndReporter(reviewId, reporterId);

    if (existingReport) {
      throw new TRPCError({ code: 'CONFLICT', message: 'You have already reported this review' });
    }

    return reviewRepository.createReport({ reviewId, reporterId, reason, details });
  },

  async getByTrainer(trainerId: string, cursor?: string, limit = 10) {
    const reviews = await reviewRepository.findByTrainerId(trainerId, cursor, limit);

    let nextCursor: string | undefined;
    if (reviews.length > limit) {
      const nextItem = reviews.pop();
      nextCursor = nextItem?.id;
    }

    return { reviews, nextCursor };
  },

  async getForDashboard(userId: string, cursor?: string, limit = 10) {
    const trainerProfile = await prisma.trainerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!trainerProfile) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Trainer profile not found' });
    }

    return this.getByTrainer(trainerProfile.id, cursor, limit);
  },
};
