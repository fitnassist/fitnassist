import { trpc } from '@/lib/trpc';

export const useClient = (id: string) => {
  return trpc.clientRoster.get.useQuery({ id }, { enabled: !!id });
};
