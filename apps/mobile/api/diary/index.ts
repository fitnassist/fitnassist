import { trpc } from '@/lib/trpc';

export const useDiaryEntries = (date: string) => {
  return trpc.diary.getEntries.useQuery(
    { date },
    { enabled: !!date },
  );
};

export const useDailyNutrition = (date: string) => {
  return trpc.diary.getDailyNutrition.useQuery(
    { date },
    { enabled: !!date },
  );
};

export const useRecentClientActivity = () => {
  return trpc.diary.getRecentClientActivity.useQuery({});
};

export const useRecentClientGoalUpdates = () => {
  return trpc.goal.getRecentClientGoalUpdates.useQuery({});
};
