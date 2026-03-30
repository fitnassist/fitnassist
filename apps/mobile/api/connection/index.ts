import { trpc } from '@/lib/trpc';

export const useConnectionRequests = () => {
  return trpc.contact.getMyRequests.useQuery();
};

export const useContactStats = () => {
  return trpc.contact.getStats.useQuery();
};
