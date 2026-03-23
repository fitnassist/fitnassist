import { trpc } from '@/lib/trpc';
import type { MuscleGroup, ExperienceLevel } from '@fitnassist/database';

export const useExercises = (filters: {
  search?: string;
  muscleGroup?: MuscleGroup;
  difficulty?: ExperienceLevel;
  page?: number;
  limit?: number;
}) => {
  return trpc.exercise.list.useQuery({
    search: filters.search || undefined,
    muscleGroup: filters.muscleGroup,
    difficulty: filters.difficulty,
    page: filters.page ?? 1,
    limit: filters.limit ?? 20,
  });
};
