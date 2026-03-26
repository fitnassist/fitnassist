import { trpc } from '@/lib/trpc';

export const useSetHandle = () => {
  const utils = trpc.useUtils();

  return trpc.trainee.setHandle.useMutation({
    onSuccess: () => {
      utils.trainee.getMyProfile.invalidate();
    },
  });
};
