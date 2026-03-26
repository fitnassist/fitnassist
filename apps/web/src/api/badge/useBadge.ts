import { trpc } from '@/lib/trpc';

export const useUserBadges = (userId?: string) => {
  return trpc.badge.getUserBadges.useQuery(
    userId ? { userId } : undefined,
  );
};

export const useShowcaseBadges = (userId: string) => {
  return trpc.badge.getShowcaseBadges.useQuery(
    { userId },
    { enabled: !!userId },
  );
};

export const useSetShowcaseBadges = () => {
  const utils = trpc.useUtils();
  return trpc.badge.setShowcaseBadges.useMutation({
    onSuccess: () => {
      utils.badge.getUserBadges.invalidate();
      utils.badge.getShowcaseBadges.invalidate();
    },
  });
};

export const useMyShowcaseBadgeIds = () => {
  return trpc.badge.getMyShowcaseBadgeIds.useQuery();
};

export const useAllBadgeDefinitions = () => {
  return trpc.badge.getAllBadgeDefinitions.useQuery(undefined, {
    staleTime: Infinity,
  });
};
