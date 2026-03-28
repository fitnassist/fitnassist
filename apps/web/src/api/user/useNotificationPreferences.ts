import { trpc } from '@/lib/trpc';

export const useNotificationPreferences = () => {
  return trpc.user.getNotificationPreferences.useQuery();
};

export const useUpdateNotificationPreferences = () => {
  const utils = trpc.useUtils();

  return trpc.user.updateNotificationPreferences.useMutation({
    onSuccess: () => {
      utils.user.getNotificationPreferences.invalidate();
    },
  });
};

export const useUpdatePhoneNumber = () => {
  const utils = trpc.useUtils();

  return trpc.user.updatePhoneNumber.useMutation({
    onSuccess: () => {
      utils.user.getNotificationPreferences.invalidate();
    },
  });
};
