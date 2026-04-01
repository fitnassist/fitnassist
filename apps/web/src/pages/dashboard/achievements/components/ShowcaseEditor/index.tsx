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
  BRONZE: 'text-amber-700 dark:text-amber-400',
  SILVER: 'text-slate-600 dark:text-slate-300',
  GOLD: 'text-yellow-600 dark:text-yellow-400',
};

interface ShowcaseEditorProps {
  showcaseBadges: BadgeDefinition[];
  maxSlots?: number;
}

export const ShowcaseEditor = ({ showcaseBadges, maxSlots = 5 }: ShowcaseEditorProps) => {
  const emptySlots = maxSlots - showcaseBadges.length;

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Your Showcase</h3>
        <span className="text-xs text-muted-foreground">
          {showcaseBadges.length} / {maxSlots} slots
        </span>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Choose up to {maxSlots} badges to display on your profile. Click &quot;Showcase&quot; on any
        earned badge below.
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {showcaseBadges.map((badge) => {
          const Icon = ICON_MAP[badge.icon] ?? Award;
          return (
            <div key={badge.id} className="flex shrink-0 flex-col items-center gap-1">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/5">
                <Icon className={cn('h-7 w-7', TIER_STYLES[badge.tier])} />
              </div>
              <span className="max-w-[70px] truncate text-[10px] font-medium">{badge.name}</span>
            </div>
          );
        })}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div key={`empty-${i}`} className="flex shrink-0 flex-col items-center gap-1">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/20">
              <span className="text-lg text-muted-foreground/30">+</span>
            </div>
            <span className="text-[10px] text-muted-foreground/40">Empty</span>
          </div>
        ))}
      </div>
    </div>
  );
};
