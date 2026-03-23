import { trpc } from '@/lib/trpc';
import type { GoalStatus } from '@fitnassist/database';

// =============================================================================
// QUERIES
// =============================================================================

export const useGoals = (status?: GoalStatus) => {
  return trpc.goal.list.useQuery({ status });
};

export const useRecentClientGoalUpdates = () => {
  return trpc.goal.getRecentClientGoalUpdates.useQuery(
    { limit: 10 },
  );
};

// =============================================================================
// MUTATIONS
// =============================================================================

export const useCreateGoal = () => {
  const utils = trpc.useUtils();
  return trpc.goal.create.useMutation({
    onSuccess: () => {
      utils.goal.list.invalidate();
    },
  });
};

export const useUpdateGoal = () => {
  const utils = trpc.useUtils();
  return trpc.goal.update.useMutation({
    onSuccess: () => {
      utils.goal.list.invalidate();
    },
  });
};

export const useCompleteGoal = () => {
  const utils = trpc.useUtils();
  return trpc.goal.complete.useMutation({
    onSuccess: () => {
      utils.goal.list.invalidate();
    },
  });
};

export const useAbandonGoal = () => {
  const utils = trpc.useUtils();
  return trpc.goal.abandon.useMutation({
    onSuccess: () => {
      utils.goal.list.invalidate();
    },
  });
};
