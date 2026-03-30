import { trpc } from '@/lib/trpc';

export const useClients = () => {
  return trpc.clientRoster.list.useQuery();
};

export const useClient = (id: string) => {
  return trpc.clientRoster.get.useQuery(
    { id },
    { enabled: !!id },
  );
};
