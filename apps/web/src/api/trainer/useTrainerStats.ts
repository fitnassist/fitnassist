import { trpc } from '@/lib/trpc';

export function useTrainerStats() {
  return trpc.trainer.getStats.useQuery();
}
