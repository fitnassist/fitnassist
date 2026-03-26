import { trpc } from '@/lib/trpc';

export const useCheckHandleAvailability = (handle: string) => {
  return trpc.trainee.checkHandleAvailability.useQuery(
    { handle },
    {
      enabled: handle.length >= 3 && /^[a-z0-9_-]+$/.test(handle),
      staleTime: 5000,
    },
  );
};
