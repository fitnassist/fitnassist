import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';

export interface UseRequireProfileReturn {
  hasProfile: boolean;
  isLoading: boolean;
  isTrainer: boolean;
  needsOnboarding: boolean;
}

export function useRequireProfile(): UseRequireProfileReturn {
  const { isTrainer, isLoading: isAuthLoading } = useAuth();

  const { data, isLoading: isProfileLoading } = trpc.trainer.hasProfile.useQuery(undefined, {
    enabled: isTrainer && !isAuthLoading,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const hasProfile = data?.hasProfile ?? false;
  const isLoading = isAuthLoading || (isTrainer && isProfileLoading);
  const needsOnboarding = isTrainer && !isLoading && !hasProfile;

  return {
    hasProfile,
    isLoading,
    isTrainer,
    needsOnboarding,
  };
}
