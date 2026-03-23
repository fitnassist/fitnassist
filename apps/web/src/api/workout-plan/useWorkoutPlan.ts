import { trpc } from '@/lib/trpc';

export const useWorkoutPlan = (id: string) => {
  return trpc.workoutPlan.get.useQuery(
    { id },
    { enabled: !!id }
  );
};
