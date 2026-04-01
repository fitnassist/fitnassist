import { trpc } from '@/lib/trpc';

export const useMealPlan = (id: string) => {
  return trpc.mealPlan.get.useQuery({ id }, { enabled: !!id });
};
