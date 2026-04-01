import {
  Flame,
  Dumbbell,
  Utensils,
  Heart,
  Users,
  Target,
  Compass,
  Footprints,
  Droplets,
  Moon,
  Smile,
  Camera,
  Award,
  Star,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { BadgeDefinition } from '@fitnassist/schemas';

const ICON_MAP: Record<string, LucideIcon> = {
  Flame,
  Dumbbell,
  Utensils,
  Heart,
  Users,
  Target,
  Compass,
  Footprints,
  Droplets,
  Moon,
  Smile,
  Camera,
  Award,
  Star,
  Trophy,
  Zap,
};

const TIER_STYLES = {
  BRONZE:
    'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700',
  SILVER:
    'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/40 border-slate-300 dark:border-slate-600',
  GOLD: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-950/40 border-yellow-400 dark:border-yellow-600',
};

interface ShowcaseBadgesProps {
  badges: BadgeDefinition[];
}

export const ShowcaseBadges = ({ badges }: ShowcaseBadgesProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-light uppercase tracking-wider">
          <Award className="h-5 w-5" />
          Badges
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {badges.map((badge) => {
            const Icon = ICON_MAP[badge.icon] ?? Award;
            return (
              <div key={badge.id} className="group relative flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-full border-2',
                    TIER_STYLES[badge.tier],
                  )}
                >
                  <Icon className="h-7 w-7" />
                </div>
                <span className="max-w-[70px] truncate text-[10px] font-medium text-center">
                  {badge.name}
                </span>
                {/* Tooltip on hover */}
                <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-[11px] text-popover-foreground shadow-md opacity-0 transition-opacity group-hover:opacity-100 border">
                  {badge.description}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
