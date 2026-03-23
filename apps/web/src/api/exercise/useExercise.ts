import { trpc } from '@/lib/trpc';

export const useExercise = (id: string) => {
  return trpc.exercise.get.useQuery(
    { id },
    { enabled: !!id }
  );
};
