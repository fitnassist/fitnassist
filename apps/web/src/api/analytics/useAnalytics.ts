import { trpc } from '@/lib/trpc';

export const useDashboardStats = () => {
  return trpc.trainer.getDashboardStats.useQuery();
};
