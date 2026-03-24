import { trpc } from '@/lib/trpc';

export const useProfileViewTrend = () => {
  return trpc.analytics.profileViewTrend.useQuery();
};

export const useBookingAnalytics = () => {
  return trpc.analytics.bookingAnalytics.useQuery();
};

export const useClientAdherence = () => {
  return trpc.analytics.clientAdherence.useQuery();
};

export const useGoalAnalytics = () => {
  return trpc.analytics.goalAnalytics.useQuery();
};
