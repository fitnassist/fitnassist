import { trpc } from '@/lib/trpc';

export const useClientStats = () => {
  return trpc.clientRoster.stats.useQuery();
};
