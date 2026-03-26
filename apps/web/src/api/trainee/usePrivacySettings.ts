import { trpc } from '@/lib/trpc';

export const usePrivacySettings = () => {
  return trpc.trainee.getPrivacySettings.useQuery();
};

export const useUpdatePrivacySettings = () => {
  const utils = trpc.useUtils();

  return trpc.trainee.updatePrivacySettings.useMutation({
    onSuccess: () => {
      utils.trainee.getPrivacySettings.invalidate();
      utils.trainee.getMyProfile.invalidate();
    },
  });
};
