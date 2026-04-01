import { trpc } from '@/lib/trpc';

export const useOnboardingResponses = (clientRosterId: string) => {
  return trpc.onboarding.getResponsesForClient.useQuery(
    { clientRosterId },
    { enabled: !!clientRosterId },
  );
};

export const useOnboardingReview = () => {
  const utils = trpc.useUtils();
  return trpc.onboarding.reviewResponse.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.onboarding.submittedResponses.invalidate(),
        utils.onboarding.getResponsesForClient.invalidate(),
        utils.onboarding.stats.invalidate(),
        utils.onboarding.pendingReviewCount.invalidate(),
        utils.clientRoster.list.invalidate(),
        utils.clientRoster.get.invalidate(),
        utils.clientRoster.stats.invalidate(),
      ]);
    },
  });
};

export const useSubmittedResponses = () => {
  return trpc.onboarding.submittedResponses.useQuery();
};

export const useOnboardingStats = () => {
  return trpc.onboarding.stats.useQuery();
};

export const useOnboardingPendingReviewCount = () => {
  return trpc.onboarding.pendingReviewCount.useQuery();
};
