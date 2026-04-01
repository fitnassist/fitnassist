import { trpc } from '@/lib/trpc';

// Queries

export const useTrainerReviews = (trainerId: string) => {
  return trpc.review.getByTrainer.useInfiniteQuery(
    { trainerId, limit: 10 },
    {
      enabled: !!trainerId,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );
};

export const useReviewEligibility = (trainerId: string, enabled = true) => {
  return trpc.review.checkEligibility.useQuery({ trainerId }, { enabled: !!trainerId && enabled });
};

export const useDashboardReviews = () => {
  return trpc.review.getForDashboard.useInfiniteQuery(
    { limit: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );
};

// Mutations

const invalidateReviewQueries = (utils: ReturnType<typeof trpc.useUtils>) => {
  utils.review.getByTrainer.invalidate();
  utils.review.checkEligibility.invalidate();
  utils.review.getForDashboard.invalidate();
  utils.trainer.getByHandle.invalidate();
  utils.trainer.search.invalidate();
};

export const useCreateReview = () => {
  const utils = trpc.useUtils();
  return trpc.review.create.useMutation({
    onSuccess: () => invalidateReviewQueries(utils),
  });
};

export const useUpdateReview = () => {
  const utils = trpc.useUtils();
  return trpc.review.update.useMutation({
    onSuccess: () => invalidateReviewQueries(utils),
  });
};

export const useReplyToReview = () => {
  const utils = trpc.useUtils();
  return trpc.review.reply.useMutation({
    onSuccess: () => {
      utils.review.getByTrainer.invalidate();
      utils.review.getForDashboard.invalidate();
    },
  });
};

export const useReportReview = () => {
  return trpc.review.report.useMutation();
};
