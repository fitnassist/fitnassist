import { trpc } from '@/lib/trpc';

type LeaderboardType =
  | 'STEPS'
  | 'WORKOUTS'
  | 'STREAKS'
  | 'GOALS'
  | 'ACTIVITY_DURATION'
  | 'RUNNING_DISTANCE'
  | 'CYCLING_DISTANCE'
  | 'FASTEST_5K';
type LeaderboardPeriod = 'WEEKLY' | 'MONTHLY' | 'ALL_TIME';
type LeaderboardScope = 'GLOBAL' | 'FRIENDS';

export const useLeaderboard = (
  type: LeaderboardType,
  period: LeaderboardPeriod,
  scope: LeaderboardScope,
) => {
  return trpc.leaderboard.getLeaderboard.useQuery({ type, period, scope });
};

export const useLeaderboardOptIn = () => {
  return trpc.leaderboard.getOptInStatus.useQuery();
};

export const useSetLeaderboardOptIn = () => {
  const utils = trpc.useUtils();
  return trpc.leaderboard.setOptInStatus.useMutation({
    onSuccess: () => {
      utils.leaderboard.getOptInStatus.invalidate();
      utils.leaderboard.getLeaderboard.invalidate();
    },
  });
};
