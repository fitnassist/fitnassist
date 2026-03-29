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

export const useRevenueAnalytics = () => {
  return trpc.analytics.revenueAnalytics.useQuery();
};

export const useRevenueTransactions = () => {
  return trpc.analytics.revenueTransactions.useInfiniteQuery(
    { limit: 20 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );
};

export const useProductOrderTransactions = () => {
  return trpc.analytics.productOrderTransactions.useInfiniteQuery(
    { limit: 20 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );
};
