import { trpc } from '@/lib/trpc';

export const useTraineeByHandle = (handle: string) => {
  return trpc.trainee.getByHandle.useQuery(
    { handle },
    { enabled: !!handle },
  );
};
