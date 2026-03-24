import { prisma } from '../lib/prisma';
import type { SubscriptionStatus, SubscriptionTier, BillingPeriod } from '@fitnassist/database';

export const subscriptionRepository = {
  findByTrainerId: (trainerId: string) => {
    return prisma.subscription.findUnique({
      where: { trainerId },
    });
  },

  findByStripeCustomerId: (stripeCustomerId: string) => {
    return prisma.subscription.findUnique({
      where: { stripeCustomerId },
    });
  },

  findByStripeSubscriptionId: (stripeSubscriptionId: string) => {
    return prisma.subscription.findUnique({
      where: { stripeSubscriptionId },
    });
  },

  create: (data: {
    trainerId: string;
    stripeCustomerId: string;
    stripeSubscriptionId?: string;
    stripePriceId?: string;
    status: SubscriptionStatus;
    tier: SubscriptionTier;
    billingPeriod?: BillingPeriod;
    trialStartDate?: Date;
    trialEndDate?: Date;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
  }) => {
    return prisma.subscription.create({ data });
  },

  update: (
    id: string,
    data: {
      stripeSubscriptionId?: string;
      stripePriceId?: string;
      status?: SubscriptionStatus;
      tier?: SubscriptionTier;
      billingPeriod?: BillingPeriod;
      currentPeriodStart?: Date;
      currentPeriodEnd?: Date;
      cancelAtPeriodEnd?: boolean;
      canceledAt?: Date | null;
    }
  ) => {
    return prisma.subscription.update({
      where: { id },
      data,
    });
  },

  updateByStripeSubscriptionId: (
    stripeSubscriptionId: string,
    data: {
      stripePriceId?: string;
      status?: SubscriptionStatus;
      tier?: SubscriptionTier;
      billingPeriod?: BillingPeriod;
      currentPeriodStart?: Date;
      currentPeriodEnd?: Date;
      cancelAtPeriodEnd?: boolean;
      canceledAt?: Date | null;
    }
  ) => {
    return prisma.subscription.update({
      where: { stripeSubscriptionId },
      data,
    });
  },

  updateByStripeCustomerId: (
    stripeCustomerId: string,
    data: {
      stripeSubscriptionId?: string;
      stripePriceId?: string;
      status?: SubscriptionStatus;
      tier?: SubscriptionTier;
      billingPeriod?: BillingPeriod;
      currentPeriodStart?: Date;
      currentPeriodEnd?: Date;
      cancelAtPeriodEnd?: boolean;
      canceledAt?: Date | null;
    }
  ) => {
    return prisma.subscription.update({
      where: { stripeCustomerId },
      data,
    });
  },

  updateTrainerTier: (trainerId: string, tier: SubscriptionTier) => {
    return prisma.trainerProfile.update({
      where: { id: trainerId },
      data: { subscriptionTier: tier },
    });
  },

  delete: (id: string) => {
    return prisma.subscription.delete({ where: { id } });
  },
};
