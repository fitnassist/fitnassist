import { trpc } from '@/lib/trpc';

export const useClients = (filters: {
  status?: 'ONBOARDING' | 'ACTIVE' | 'INACTIVE' | 'ON_HOLD';
  includeDisconnected?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  return trpc.clientRoster.list.useQuery({
    status: filters.status,
    includeDisconnected: filters.includeDisconnected,
    search: filters.search || undefined,
    page: filters.page ?? 1,
    limit: filters.limit ?? 20,
  });
};
