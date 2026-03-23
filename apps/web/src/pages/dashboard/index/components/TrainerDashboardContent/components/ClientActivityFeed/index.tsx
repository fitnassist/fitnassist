import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { Activity, Scale, Droplets, Ruler, SmilePlus, Moon, UtensilsCrossed, Dumbbell, Footprints, Camera, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { useRecentClientActivity } from '@/api/diary';
import { useRecentClientGoalUpdates } from '@/api/goal';

const ENTRY_ICONS: Record<string, { icon: typeof Scale; color: string }> = {
  WEIGHT: { icon: Scale, color: 'text-emerald-500' },
  WATER: { icon: Droplets, color: 'text-cyan-500' },
  MEASUREMENT: { icon: Ruler, color: 'text-orange-500' },
  MOOD: { icon: SmilePlus, color: 'text-amber-500' },
  SLEEP: { icon: Moon, color: 'text-indigo-500' },
  FOOD: { icon: UtensilsCrossed, color: 'text-red-500' },
  WORKOUT_LOG: { icon: Dumbbell, color: 'text-violet-500' },
  STEPS: { icon: Footprints, color: 'text-teal-500' },
  PROGRESS_PHOTO: { icon: Camera, color: 'text-pink-500' },
};

const ENTRY_LABELS: Record<string, string> = {
  WEIGHT: 'logged weight',
  WATER: 'logged water intake',
  MEASUREMENT: 'logged measurements',
  MOOD: 'logged mood',
  SLEEP: 'logged sleep',
  FOOD: 'logged food',
  WORKOUT_LOG: 'logged a workout',
  STEPS: 'logged steps',
  PROGRESS_PHOTO: 'added progress photos',
};

interface ActivityItem {
  id: string;
  type: 'diary' | 'goal';
  clientRosterId: string | null;
  userName: string;
  description: string;
  icon: typeof Scale;
  iconColor: string;
  timestamp: Date;
}

export const ClientActivityFeed = () => {
  const { data: diaryActivity } = useRecentClientActivity();
  const { data: goalUpdates } = useRecentClientGoalUpdates();

  const feedItems = useMemo(() => {
    const items: ActivityItem[] = [];

    // Map diary entries
    for (const entry of diaryActivity ?? []) {
      const typed = entry as unknown as {
        user?: { id: string; name: string; image: string | null };
        clientRosterId?: string | null;
      };
      if (!typed.user) continue;

      const iconInfo = ENTRY_ICONS[entry.type] ?? { icon: Activity, color: 'text-muted-foreground' };
      const label = ENTRY_LABELS[entry.type] ?? 'logged an entry';

      items.push({
        id: entry.id,
        type: 'diary',
        clientRosterId: typed.clientRosterId ?? null,
        userName: typed.user.name,
        description: label,
        icon: iconInfo.icon,
        iconColor: iconInfo.color,
        timestamp: new Date(entry.createdAt as unknown as string),
      });
    }

    // Map goal completions
    for (const goal of goalUpdates ?? []) {
      const typed = goal as unknown as {
        user?: { id: string; name: string; image: string | null };
        clientRosterId?: string | null;
      };
      if (!typed.user) continue;

      items.push({
        id: goal.id,
        type: 'goal',
        clientRosterId: typed.clientRosterId ?? null,
        userName: typed.user.name,
        description: `completed goal: ${goal.name}`,
        icon: Trophy,
        iconColor: 'text-yellow-500',
        timestamp: new Date(goal.completedAt as unknown as string),
      });
    }

    // Sort by timestamp descending, take first 10
    return items
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
  }, [diaryActivity, goalUpdates]);

  if (feedItems.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          Client Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {feedItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={`${item.type}-${item.id}`}
                to={item.clientRosterId ? `/dashboard/clients/${item.clientRosterId}` : '/dashboard/clients'}
                className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/50"
              >
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted ${item.iconColor}`}>
                  <IconComponent className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    <span className="font-medium">{item.userName}</span>{' '}
                    <span className="text-muted-foreground">{item.description}</span>
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                </span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
