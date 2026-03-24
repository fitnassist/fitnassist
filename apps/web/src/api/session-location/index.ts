import { trpc } from '@/lib/trpc';

export const useSessionLocations = () => {
  return trpc.sessionLocation.list.useQuery();
};

export const useCreateSessionLocation = () => {
  const utils = trpc.useUtils();
  return trpc.sessionLocation.create.useMutation({
    onSuccess: () => {
      utils.sessionLocation.list.invalidate();
    },
  });
};

export const useUpdateSessionLocation = () => {
  const utils = trpc.useUtils();
  return trpc.sessionLocation.update.useMutation({
    onSuccess: () => {
      utils.sessionLocation.list.invalidate();
    },
  });
};

export const useDeleteSessionLocation = () => {
  const utils = trpc.useUtils();
  return trpc.sessionLocation.delete.useMutation({
    onSuccess: () => {
      utils.sessionLocation.list.invalidate();
    },
  });
};
