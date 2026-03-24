import { trpc } from '@/lib/trpc';
import type { ContactRequestStatus } from '@fitnassist/types';

export function useContactRequests(status?: ContactRequestStatus) {
  return trpc.contact.getMyRequests.useQuery({ status });
}

export function useUpdateContactStatus() {
  const utils = trpc.useUtils();

  return trpc.contact.updateStatus.useMutation({
    onSuccess: () => {
      utils.contact.getMyRequests.invalidate();
      utils.trainer.getDashboardStats.invalidate();
    },
  });
}

export function useContactStats() {
  return trpc.contact.getStats.useQuery();
}
