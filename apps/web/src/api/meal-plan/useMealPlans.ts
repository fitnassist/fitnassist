import { trpc } from '@/lib/trpc';

export const useMealPlans = (filters: { search?: string; page?: number; limit?: number }) => {
  return trpc.mealPlan.list.useQuery({
    search: filters.search || undefined,
    page: filters.page ?? 1,
    limit: filters.limit ?? 20,
  });
};
