import { trpc } from '@/lib/trpc';
import { keepPreviousData } from '@tanstack/react-query';
import type { TrainerSearchInput } from '@fitnassist/schemas';

export function useTrainers(params: TrainerSearchInput) {
  return trpc.trainer.search.useQuery(params, {
    placeholderData: keepPreviousData,
  });
}
