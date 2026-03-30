import { trpc } from '@/lib/trpc';

export const useMyTraineeProfile = () => {
  return trpc.trainee.getMyProfile.useQuery();
};

export const useUpdateTraineeProfile = () => {
  const utils = trpc.useUtils();
  return trpc.trainee.update.useMutation({
    onSuccess: () => {
      utils.trainee.getMyProfile.invalidate();
    },
  });
};

export const useNutritionTargets = () => {
  return trpc.trainee.getNutritionTargets.useQuery();
};
