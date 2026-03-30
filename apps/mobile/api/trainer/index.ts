import { trpc } from '@/lib/trpc';

export const useMyTrainerProfile = () => {
  return trpc.trainer.getMyProfile.useQuery();
};

export const useUpdateTrainerProfile = () => {
  const utils = trpc.useUtils();
  return trpc.trainer.update.useMutation({
    onSuccess: () => {
      utils.trainer.getMyProfile.invalidate();
    },
  });
};

export const useDashboardStats = () => {
  return trpc.trainer.getDashboardStats.useQuery();
};

export const useTrainerSearch = (params: {
  latitude?: number;
  longitude?: number;
  radiusMiles?: number;
  services?: string[];
  acceptingClients?: boolean;
  sortBy?: 'distance' | 'recently_active' | 'newest' | 'price_low' | 'price_high';
  page?: number;
  limit?: number;
}) => {
  return trpc.trainer.search.useQuery(params);
};

export const useTrainerByHandle = (handle: string) => {
  return trpc.trainer.getByHandle.useQuery(
    { handle },
    { enabled: !!handle },
  );
};

export const usePublishProfile = () => {
  const utils = trpc.useUtils();
  return trpc.trainer.publish.useMutation({
    onSuccess: () => {
      utils.trainer.getMyProfile.invalidate();
    },
  });
};
