import { trpc } from '@/lib/trpc';

export function useMyProfile() {
  return trpc.trainer.getMyProfile.useQuery();
}

export function useUpdateProfile() {
  const utils = trpc.useUtils();

  return trpc.trainer.update.useMutation({
    onSuccess: () => {
      utils.trainer.getMyProfile.invalidate();
    },
  });
}

export function useCreateProfile() {
  const utils = trpc.useUtils();

  return trpc.trainer.create.useMutation({
    onSuccess: () => {
      utils.trainer.getMyProfile.invalidate();
    },
  });
}

export function usePublishProfile() {
  const utils = trpc.useUtils();

  return trpc.trainer.publish.useMutation({
    onSuccess: () => {
      utils.trainer.getMyProfile.invalidate();
    },
  });
}

export function useUnpublishProfile() {
  const utils = trpc.useUtils();

  return trpc.trainer.unpublish.useMutation({
    onSuccess: () => {
      utils.trainer.getMyProfile.invalidate();
    },
  });
}
