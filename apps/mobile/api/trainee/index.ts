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

export const useTraineeByHandle = (handle: string) => {
  return trpc.trainee.getByHandle.useQuery({ handle }, { enabled: !!handle });
};

export const usePublicProfileData = (handle: string) => {
  return trpc.trainee.getPublicProfileData.useQuery({ handle }, { enabled: !!handle });
};
