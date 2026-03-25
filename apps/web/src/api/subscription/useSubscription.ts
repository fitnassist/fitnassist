import { trpc } from '@/lib/trpc';

export const useSubscription = (enabled = true) => {
  return trpc.subscription.getCurrent.useQuery(undefined, {
    enabled,
    staleTime: 30_000,
  });
};
