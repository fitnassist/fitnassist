import { trpc } from '@/lib/trpc';

export const useMyPendingOnboarding = () => {
  return trpc.onboarding.myPending.useQuery();
};

export const useTraineeOnboardingResponse = (responseId: string) => {
  return trpc.onboarding.getResponse.useQuery(
    { responseId },
    { enabled: !!responseId }
  );
};

export const useSubmitOnboarding = () => {
  const utils = trpc.useUtils();
  return trpc.onboarding.submitResponse.useMutation({
    onSuccess: async (_data, variables) => {
      await Promise.all([
        utils.onboarding.myPending.invalidate(),
        utils.onboarding.getResponse.invalidate({ responseId: variables.responseId }),
      ]);
    },
  });
};
