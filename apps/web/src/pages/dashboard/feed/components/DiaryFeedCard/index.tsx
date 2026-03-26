import { Link } from 'react-router-dom';
import {
  Scale,
  Droplets,
  Ruler,
  Smile,
  Moon,
  Utensils,
  Dumbbell,
  Camera,
  Footprints,
  Activity,
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui';
import { useLikeDiaryEntry, useUnlikeDiaryEntry } from '@/api/post';
import { routes } from '@/config/routes';
import { LikeButton } from '../LikeButton';
import { formatRelativeTime } from '../../feed.utils';

interface DiaryFeedCardProps {
  id: string;
  type: string;
  date: string;
  createdAt: string;
  hasLiked: boolean;
  likeCount: number;
  user: {
    id: string;
    name: string;
    image: string | null;
    role: string;
    traineeProfile: { avatarUrl: string | null; handle: string | null } | null;
  };
  weightEntry?: { weightKg: number } | null;
  waterEntry?: { totalMl: number } | null;
  moodEntry?: { level: string; notes: string | null } | null;
  sleepEntry?: { hoursSlept: number; quality: number | null } | null;
  stepsEntry?: { count: number } | null;
  activityEntry?: { activityType: string; durationMinutes: number; distanceKm: number | null; caloriesBurned: number | null } | null;
  workoutLogEntry?: { workoutPlan: { name: string } | null; notes: string | null } | null;
  foodEntryCount?: number;
}

const DIARY_TYPE_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  WEIGHT: { icon: Scale, label: 'Logged weight', color: 'text-blue-500' },
  WATER: { icon: Droplets, label: 'Logged water', color: 'text-cyan-500' },
  MEASUREMENT: { icon: Ruler, label: 'Logged measurements', color: 'text-purple-500' },
  MOOD: { icon: Smile, label: 'Logged mood', color: 'text-yellow-500' },
  SLEEP: { icon: Moon, label: 'Logged sleep', color: 'text-indigo-500' },
  FOOD: { icon: Utensils, label: 'Logged food', color: 'text-green-500' },
  WORKOUT_LOG: { icon: Dumbbell, label: 'Logged a workout', color: 'text-coral-500' },
  PROGRESS_PHOTO: { icon: Camera, label: 'Added progress photos', color: 'text-pink-500' },
  STEPS: { icon: Footprints, label: 'Logged steps', color: 'text-orange-500' },
  ACTIVITY: { icon: Activity, label: 'Logged activity', color: 'text-emerald-500' },
};

const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const getDiaryDetail = (props: DiaryFeedCardProps): string | null => {
  switch (props.type) {
    case 'WEIGHT':
      return props.weightEntry ? `${props.weightEntry.weightKg} kg` : null;
    case 'WATER':
      return props.waterEntry ? `${props.waterEntry.totalMl} ml` : null;
    case 'MOOD':
      return props.moodEntry
        ? `${props.moodEntry.level.toLowerCase().replace('_', ' ')}${props.moodEntry.notes ? ` — ${props.moodEntry.notes}` : ''}`
        : null;
    case 'SLEEP':
      return props.sleepEntry ? `${props.sleepEntry.hoursSlept} hours` : null;
    case 'STEPS':
      return props.stepsEntry ? `${props.stepsEntry.count.toLocaleString()} steps` : null;
    case 'ACTIVITY':
      if (!props.activityEntry) return null;
      const parts = [
        props.activityEntry.activityType.toLowerCase(),
        `${props.activityEntry.durationMinutes} min`,
      ];
      if (props.activityEntry.distanceKm) parts.push(`${props.activityEntry.distanceKm} km`);
      return parts.join(' · ');
    case 'WORKOUT_LOG':
      return props.workoutLogEntry?.workoutPlan?.name ?? 'Free workout';
    case 'FOOD':
      return props.foodEntryCount ? `${props.foodEntryCount} items logged` : null;
    default:
      return null;
  }
};

export const DiaryFeedCard = (props: DiaryFeedCardProps) => {
  const likeDiaryEntry = useLikeDiaryEntry();
  const unlikeDiaryEntry = useUnlikeDiaryEntry();

  const config = DIARY_TYPE_CONFIG[props.type] ?? {
    icon: Activity,
    label: 'Diary entry',
    color: 'text-muted-foreground',
  };
  const Icon = config.icon;
  const detail = getDiaryDetail(props);
  const avatarUrl = props.user.traineeProfile?.avatarUrl ?? props.user.image;
  const handle = props.user.traineeProfile?.handle;
  const profileUrl = routes.traineePublicProfile(handle ?? props.user.id);

  return (
    <div className="rounded-lg border bg-card p-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link to={profileUrl} className="shrink-0">
          <Avatar className="h-10 w-10">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={props.user.name} />}
            <AvatarFallback>{getInitials(props.user.name)}</AvatarFallback>
          </Avatar>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link to={profileUrl} className="text-sm font-medium hover:underline truncate">
              {props.user.name}
            </Link>
            <span className="text-sm text-muted-foreground">{config.label}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {formatRelativeTime(props.createdAt)}
          </div>
        </div>

        <div className={`shrink-0 ${config.color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {/* Detail */}
      {detail && (
        <div className="mt-3 rounded-md bg-muted/50 px-3 py-2">
          <p className="text-sm font-medium">{detail}</p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex items-center border-t pt-2">
        <LikeButton
          liked={props.hasLiked}
          count={props.likeCount}
          onLike={() => likeDiaryEntry.mutate({ diaryEntryId: props.id })}
          onUnlike={() => unlikeDiaryEntry.mutate({ diaryEntryId: props.id })}
          disabled={likeDiaryEntry.isPending || unlikeDiaryEntry.isPending}
        />
      </div>
    </div>
  );
};
