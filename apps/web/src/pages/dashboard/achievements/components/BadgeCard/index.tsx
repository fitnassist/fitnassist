import { Flame, Dumbbell, Utensils, Heart, Users, Target, Compass, Footprints, Droplets, Moon, Smile, Camera, Award, Star, Trophy, Zap, type LucideIcon } from 'lucide-react';
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
  BRONZE: {
    bg: 'bg-amber-100 dark:bg-amber-950/40',
    border: 'border-amber-300 dark:border-amber-700',
    icon: 'text-amber-700 dark:text-amber-400',
    ring: 'ring-amber-300/50',
  },
  SILVER: {
    bg: 'bg-slate-100 dark:bg-slate-800/40',
    border: 'border-slate-300 dark:border-slate-600',
    icon: 'text-slate-600 dark:text-slate-300',
    ring: 'ring-slate-300/50',
  },
  GOLD: {
    bg: 'bg-yellow-100 dark:bg-yellow-950/40',
    border: 'border-yellow-400 dark:border-yellow-600',
    icon: 'text-yellow-600 dark:text-yellow-400',
    ring: 'ring-yellow-400/50',
  },
};

interface BadgeCardProps {
  badge: BadgeDefinition;
  earned: boolean;
  earnedAt?: Date;
  isShowcase?: boolean;
  onToggleShowcase?: () => void;
  onClick?: () => void;
}

export const BadgeCard = ({ badge, earned, earnedAt, isShowcase, onToggleShowcase, onClick }: BadgeCardProps) => {
  const Icon = ICON_MAP[badge.icon] ?? Award;
  const tier = TIER_STYLES[badge.tier];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all',
        'hover:shadow-md focus-visible:outline-none focus-visible:ring-2',
        earned
          ? `${tier.bg} ${tier.border} ${tier.ring}`
          : 'border-muted bg-muted/30 opacity-50 grayscale',
      )}
    >
      {isShowcase && (
        <div className="absolute -top-1.5 -right-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
          Showcase
        </div>
      )}
      <div className={cn(
        'flex h-12 w-12 items-center justify-center rounded-full',
        earned ? tier.bg : 'bg-muted',
      )}>
        <Icon className={cn('h-6 w-6', earned ? tier.icon : 'text-muted-foreground')} />
      </div>
      <div className="space-y-0.5">
        <p className="text-xs font-semibold leading-tight">{badge.name}</p>
        <p className="text-[10px] text-muted-foreground leading-tight">{badge.description}</p>
      </div>
      {earned && earnedAt && (
        <p className="text-[10px] text-muted-foreground">
          {new Date(earnedAt).toLocaleDateString()}
        </p>
      )}
      {earned && onToggleShowcase && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleShowcase();
          }}
          className={cn(
            'mt-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors',
            isShowcase
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-primary/10',
          )}
        >
          {isShowcase ? 'Remove' : 'Showcase'}
        </button>
      )}
    </button>
  );
};
