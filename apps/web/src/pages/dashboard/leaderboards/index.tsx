import { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { PageLayout } from '@/components/layouts';
import { ResponsiveTabs, TabsContent, Select } from '@/components/ui';
import type { SelectOption } from '@/components/ui';
import { useTabParam } from '@/hooks';
import { useLeaderboard, useLeaderboardOptIn } from '@/api/leaderboard';
import { LeaderboardTable, UserRankCard, OptInPrompt } from './components';

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

const TYPE_OPTIONS: SelectOption[] = [
  { value: 'STEPS', label: 'Steps' },
  { value: 'WORKOUTS', label: 'Workouts' },
  { value: 'ACTIVITY_DURATION', label: 'Activity Duration' },
  { value: 'GOALS', label: 'Goals Completed' },
  { value: 'STREAKS', label: 'Diary Streaks' },
  { value: 'RUNNING_DISTANCE', label: 'Running Distance' },
  { value: 'CYCLING_DISTANCE', label: 'Cycling Distance' },
  { value: 'FASTEST_5K', label: 'Fastest 5K' },
];

const PERIOD_OPTIONS: SelectOption[] = [
  { value: 'WEEKLY', label: 'This Week' },
  { value: 'MONTHLY', label: 'This Month' },
  { value: 'ALL_TIME', label: 'All Time' },
];

const TYPE_VALUE_LABELS: Record<LeaderboardType, string> = {
  STEPS: 'Steps',
  WORKOUTS: 'Workouts',
  ACTIVITY_DURATION: 'Minutes',
  GOALS: 'Goals',
  STREAKS: 'Days',
  RUNNING_DISTANCE: 'Distance',
  CYCLING_DISTANCE: 'Distance',
  FASTEST_5K: 'Time',
};

const formatDurationMmSs = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

const TYPE_FORMAT_VALUE: Partial<Record<LeaderboardType, (v: number) => string>> = {
  STEPS: (v) => v.toLocaleString(),
  ACTIVITY_DURATION: (v) => {
    if (v >= 60) return `${Math.floor(v / 60)}h ${v % 60}m`;
    return `${v}m`;
  },
  RUNNING_DISTANCE: (v) => `${v.toFixed(1)} km`,
  CYCLING_DISTANCE: (v) => `${v.toFixed(1)} km`,
  FASTEST_5K: (v) => formatDurationMmSs(v),
};

const SCOPE_TABS = [
  { value: 'FRIENDS', label: 'Friends' },
  { value: 'GLOBAL', label: 'Global' },
];

export const LeaderboardsPage = () => {
  const [scope, setScope] = useTabParam('FRIENDS');
  const [type, setType] = useState<LeaderboardType>('STEPS');
  const [period, setPeriod] = useState<LeaderboardPeriod>('WEEKLY');

  const { data, isLoading } = useLeaderboard(type, period, scope as 'GLOBAL' | 'FRIENDS');
  const { data: isOptedIn } = useLeaderboardOptIn();

  const valueLabel = TYPE_VALUE_LABELS[type];
  const formatValue = TYPE_FORMAT_VALUE[type];

  const tabOptions = useMemo(() => SCOPE_TABS, []);

  // Streaks and Fastest 5K ignore period (always all-time)
  const showPeriod = type !== 'STREAKS' && type !== 'FASTEST_5K';

  return (
    <PageLayout>
      <PageLayout.Header
        title="Leaderboards"
        description="See how you rank against friends and the community."
      />
      <PageLayout.Content>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="w-48">
              <label htmlFor="leaderboard-type" className="sr-only">
                Leaderboard category
              </label>
              <Select
                inputId="leaderboard-type"
                options={TYPE_OPTIONS}
                value={TYPE_OPTIONS.find((o) => o.value === type)}
                onChange={(opt) => opt && setType(opt.value as LeaderboardType)}
                placeholder="Category"
              />
            </div>
            {showPeriod && (
              <div className="w-40">
                <label htmlFor="leaderboard-period" className="sr-only">
                  Leaderboard period
                </label>
                <Select
                  inputId="leaderboard-period"
                  options={PERIOD_OPTIONS}
                  value={PERIOD_OPTIONS.find((o) => o.value === period)}
                  onChange={(opt) => opt && setPeriod(opt.value as LeaderboardPeriod)}
                  placeholder="Period"
                />
              </div>
            )}
          </div>

          <ResponsiveTabs value={scope} onValueChange={setScope} options={tabOptions}>
            <TabsContent value="FRIENDS">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {data?.userRank && (
                    <UserRankCard
                      rank={data.userRank.rank}
                      value={data.userRank.value}
                      totalParticipants={data.entries.length}
                      valueLabel={valueLabel}
                      formatValue={formatValue}
                    />
                  )}
                  <LeaderboardTable
                    entries={data?.entries ?? []}
                    valueLabel={valueLabel}
                    formatValue={formatValue}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="GLOBAL">
              <div className="space-y-4">
                <OptInPrompt isOptedIn={isOptedIn ?? false} />

                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {data?.userRank && (
                      <UserRankCard
                        rank={data.userRank.rank}
                        value={data.userRank.value}
                        totalParticipants={data.entries.length}
                        valueLabel={valueLabel}
                        formatValue={formatValue}
                      />
                    )}
                    <LeaderboardTable
                      entries={data?.entries ?? []}
                      valueLabel={valueLabel}
                      formatValue={formatValue}
                    />
                  </>
                )}
              </div>
            </TabsContent>
          </ResponsiveTabs>
        </div>
      </PageLayout.Content>
    </PageLayout>
  );
};

export default LeaderboardsPage;
