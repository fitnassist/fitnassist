import { useState, useMemo, useCallback, useEffect } from 'react';
import { Loader2, Trophy } from 'lucide-react';
import { PageLayout } from '@/components/layouts';
import { Select } from '@/components/ui';
import type { SelectOption } from '@/components/ui';
import { BADGE_CATEGORIES, BADGE_MAP } from '@fitnassist/schemas';
import type { BadgeCategory } from '@fitnassist/schemas';
import { useUserBadges, useAllBadgeDefinitions, useMyShowcaseBadgeIds, useSetShowcaseBadges } from '@/api/badge';
import { BadgeGrid, ShowcaseEditor } from './components';

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'ALL', label: 'All Categories' },
  ...BADGE_CATEGORIES.map((c) => ({ value: c.key, label: c.label })),
];

export const AchievementsPage = () => {
  const [filterCategory, setFilterCategory] = useState<BadgeCategory | 'ALL'>('ALL');
  const { data: earnedBadges, isLoading: loadingEarned } = useUserBadges();
  const { data: allBadges, isLoading: loadingAll } = useAllBadgeDefinitions();
  const { data: savedShowcaseIds } = useMyShowcaseBadgeIds();
  const setShowcaseMutation = useSetShowcaseBadges();

  const [showcaseIds, setShowcaseIds] = useState<Set<string>>(new Set());

  // Sync showcase IDs from server on first load
  useEffect(() => {
    if (savedShowcaseIds) {
      setShowcaseIds(new Set(savedShowcaseIds));
    }
  }, [savedShowcaseIds]);

  const totalEarned = earnedBadges?.length ?? 0;
  const totalBadges = allBadges?.length ?? 0;

  const showcaseBadges = useMemo(
    () => Array.from(showcaseIds)
      .map((id) => BADGE_MAP.get(id))
      .filter((b): b is NonNullable<typeof b> => b !== undefined),
    [showcaseIds],
  );

  const handleToggleShowcase = useCallback((badgeId: string) => {
    setShowcaseIds((prev) => {
      const next = new Set(prev);
      if (next.has(badgeId)) {
        next.delete(badgeId);
      } else if (next.size < 5) {
        next.add(badgeId);
      }
      setShowcaseMutation.mutate({ badgeIds: Array.from(next) });
      return next;
    });
  }, [setShowcaseMutation]);

  const isLoading = loadingEarned || loadingAll;

  if (isLoading) {
    return (
      <PageLayout>
        <PageLayout.Header title="Achievements" description="Earn badges as you progress on your fitness journey." />
        <PageLayout.Content>
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </PageLayout.Content>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageLayout.Header
        title="Achievements"
        description="Earn badges as you progress on your fitness journey."
      />
      <PageLayout.Content>
        <div className="space-y-6">
          {/* Stats bar */}
          <div className="flex items-center gap-4 rounded-xl border bg-card p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalEarned}</p>
              <p className="text-sm text-muted-foreground">
                of {totalBadges} badges earned
              </p>
            </div>
            <div className="ml-auto">
              <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${totalBadges > 0 ? (totalEarned / totalBadges) * 100 : 0}%` }}
                />
              </div>
              <p className="mt-1 text-right text-xs text-muted-foreground">
                {totalBadges > 0 ? Math.round((totalEarned / totalBadges) * 100) : 0}%
              </p>
            </div>
          </div>

          {/* Showcase */}
          <ShowcaseEditor showcaseBadges={showcaseBadges} />

          {/* Filter */}
          <div className="w-48">
            <Select
              options={CATEGORY_OPTIONS}
              value={CATEGORY_OPTIONS.find((o) => o.value === filterCategory)}
              onChange={(opt) => opt && setFilterCategory(opt.value as BadgeCategory | 'ALL')}
              placeholder="Category"
            />
          </div>

          {/* Badge grid */}
          <BadgeGrid
            allBadges={allBadges ?? []}
            earnedBadges={earnedBadges ?? []}
            showcaseBadgeIds={showcaseIds}
            onToggleShowcase={handleToggleShowcase}
            filterCategory={filterCategory}
          />
        </div>
      </PageLayout.Content>
    </PageLayout>
  );
};

export default AchievementsPage;
