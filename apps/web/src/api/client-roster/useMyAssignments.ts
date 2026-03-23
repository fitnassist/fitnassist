import { trpc } from '@/lib/trpc';

export const useMyAssignments = () => {
  return trpc.clientRoster.myAssignments.useQuery();
};
