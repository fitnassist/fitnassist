import { trpc } from '@/lib/trpc';

export const useSubscription = () => {
  return trpc.subscription.getCurrent.useQuery(undefined, {
    staleTime: 30_000,
  });
};
