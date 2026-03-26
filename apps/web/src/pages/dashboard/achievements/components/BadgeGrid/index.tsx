import { BADGE_CATEGORIES } from '@fitnassist/schemas';
import type { BadgeDefinition, BadgeCategory } from '@fitnassist/schemas';
import { BadgeCard } from '../BadgeCard';

interface EarnedBadge {
  badgeId: string;
  earnedAt: Date;
  definition: BadgeDefinition | null;
}

interface BadgeGridProps {
  allBadges: BadgeDefinition[];
  earnedBadges: EarnedBadge[];
  showcaseBadgeIds: Set<string>;
  onToggleShowcase: (badgeId: string) => void;
  filterCategory: BadgeCategory | 'ALL';
}

export const BadgeGrid = ({
  allBadges,
  earnedBadges,
  showcaseBadgeIds,
  onToggleShowcase,
  filterCategory,
}: BadgeGridProps) => {
  const earnedMap = new Map(earnedBadges.map((b) => [b.badgeId, b]));

  const categories = filterCategory === 'ALL'
    ? BADGE_CATEGORIES
    : BADGE_CATEGORIES.filter((c) => c.key === filterCategory);

  return (
    <div className="space-y-8">
      {categories.map((category) => {
        const categoryBadges = allBadges.filter((b) => b.category === category.key);
        if (categoryBadges.length === 0) return null;

        const earnedCount = categoryBadges.filter((b) => earnedMap.has(b.id)).length;

        return (
          <div key={category.key}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{category.label}</h3>
              <span className="text-xs text-muted-foreground">
                {earnedCount} / {categoryBadges.length}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {categoryBadges.map((badge) => {
                const earned = earnedMap.get(badge.id);
                return (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    earned={!!earned}
                    earnedAt={earned?.earnedAt}
                    isShowcase={showcaseBadgeIds.has(badge.id)}
                    onToggleShowcase={() => onToggleShowcase(badge.id)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
