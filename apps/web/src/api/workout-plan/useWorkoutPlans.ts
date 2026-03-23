import { trpc } from '@/lib/trpc';

export const useWorkoutPlans = (filters: {
  search?: string;
  page?: number;
  limit?: number;
}) => {
  return trpc.workoutPlan.list.useQuery({
    search: filters.search || undefined,
    page: filters.page ?? 1,
    limit: filters.limit ?? 20,
  });
};
