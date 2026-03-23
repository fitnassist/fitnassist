import { trpc } from '@/lib/trpc';

export function useTrainerByHandle(handle: string) {
  return trpc.trainer.getByHandle.useQuery(
    { handle },
    { enabled: !!handle }
  );
}

export function useTrainerById(id: string) {
  return trpc.trainer.getById.useQuery(
    { id },
    { enabled: !!id }
  );
}
