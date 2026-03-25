import { useState } from 'react';
import { format, subDays, isToday as isTodayFns, isYesterday } from 'date-fns';
import { TrendingUp, Target, MessageSquare, Send, Trash2, Plus, Scale, Droplets, Ruler, SmilePlus, Moon, UtensilsCrossed, Dumbbell, Footprints, Camera, Bike } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, ConfirmDialog, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui';
import { CreateGoalForm } from '@/components/goals';
import { trpc } from '@/lib/trpc';
import { useAddDiaryComment, useDeleteDiaryComment } from '@/api/diary';
import { TrendDateRange } from '@/pages/dashboard/diary/components/Trends/TrendDateRange';
import { WeightChart } from '@/pages/dashboard/diary/components/Trends/WeightChart';
import { MeasurementChart } from '@/pages/dashboard/diary/components/Trends/MeasurementChart';
import { NutritionChart } from '@/pages/dashboard/diary/components/Trends/NutritionChart';
import { WaterChart } from '@/pages/dashboard/diary/components/Trends/WaterChart';
import { MoodChart } from '@/pages/dashboard/diary/components/Trends/MoodChart';
import { SleepChart } from '@/pages/dashboard/diary/components/Trends/SleepChart';
import { ActivityChart } from '@/pages/dashboard/diary/components/Trends/ActivityChart';
import { StepsChart } from '@/pages/dashboard/diary/components/Trends/StepsChart';
import { PersonalBests } from '@/pages/dashboard/diary/components/PersonalBests';
import { DiaryDatePicker } from '@/pages/dashboard/diary/components';
import { getMoodEmoji, getSleepQualityLabel, formatWeight, formatWater, formatMeasurement, formatDuration, formatActivityDuration, formatDistance, formatPace, ACTIVITY_TYPE_LABELS, today } from '@/pages/dashboard/diary/diary.utils';

interface ClientProgressProps {
  clientRosterId: string;
  traineeUserId: string;
}

type ChartType = 'weight' | 'measurements' | 'nutrition' | 'water' | 'mood' | 'sleep' | 'activity' | 'steps';

const CHART_TABS: Array<{ key: ChartType; label: string }> = [
  { key: 'weight', label: 'Weight' },
  { key: 'measurements', label: 'Measurements' },
  { key: 'nutrition', label: 'Nutrition' },
  { key: 'water', label: 'Water' },
  { key: 'activity', label: 'Activity' },
  { key: 'steps', label: 'Steps' },
  { key: 'mood', label: 'Mood' },
  { key: 'sleep', label: 'Sleep' },
];

type DiaryEntry = {
  id: string;
  type: string;
  date: unknown;
  weightEntry?: { weightKg: number } | null;
  waterEntry?: { totalMl: number } | null;
  measurementEntry?: {
    chestCm: number | null;
    waistCm: number | null;
    hipsCm: number | null;
    bicepCm: number | null;
    thighCm: number | null;
    calfCm: number | null;
    neckCm: number | null;
  } | null;
  moodEntry?: { level: string; notes: string | null } | null;
  sleepEntry?: { hoursSlept: number; quality: number } | null;
  foodEntries?: Array<{ name: string; calories: number }>;
  workoutLogEntry?: {
    workoutPlanName: string | null;
    durationMinutes: number;
    caloriesBurned: number | null;
    workoutPlan?: { name: string } | null;
  } | null;
  stepsEntry?: { totalSteps: number } | null;
  activityEntry?: {
    activityType: string;
    activityName: string | null;
    distanceKm: number | null;
    durationSeconds: number;
    avgPaceSecPerKm: number | null;
    caloriesBurned: number | null;
  } | null;
  progressPhotos?: Array<{ id: string; imageUrl: string; category: string | null }>;
  comments?: Array<{
    id: string;
    content: string;
    createdAt: string | Date;
    user: { id: string; name: string; image: string | null };
  }>;
};

const ENTRY_ICONS: Record<string, { icon: typeof Scale; color: string }> = {
  WEIGHT: { icon: Scale, color: 'text-emerald-500' },
  WATER: { icon: Droplets, color: 'text-cyan-500' },
  MEASUREMENT: { icon: Ruler, color: 'text-orange-500' },
  MOOD: { icon: SmilePlus, color: 'text-amber-500' },
  SLEEP: { icon: Moon, color: 'text-indigo-500' },
  FOOD: { icon: UtensilsCrossed, color: 'text-red-500' },
  WORKOUT_LOG: { icon: Dumbbell, color: 'text-violet-500' },
  STEPS: { icon: Footprints, color: 'text-teal-500' },
  ACTIVITY: { icon: Bike, color: 'text-blue-500' },
  PROGRESS_PHOTO: { icon: Camera, color: 'text-pink-500' },
};

const formatDateHeading = (dateKey: string): string => {
  const d = new Date(dateKey + 'T00:00:00');
  if (isTodayFns(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEEE, MMM d');
};


export const ClientProgress = ({ clientRosterId, traineeUserId }: ClientProgressProps) => {
  const unitPreference = 'METRIC' as const;
  const [days, setDays] = useState(30);
  const [activeChart, setActiveChart] = useState<ChartType>('weight');
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today());

  const endDate = format(new Date(), 'yyyy-MM-dd');
  const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

  const { data: clientEntries } = trpc.diary.getRange.useQuery(
    { userId: traineeUserId, startDate, endDate },
    { enabled: !!traineeUserId }
  );
  const { data: clientGoals } = trpc.goal.list.useQuery(
    { clientRosterId, status: 'ACTIVE' },
    { enabled: !!clientRosterId }
  );

  // Single-date diary entries for the date navigator
  const { data: dayEntries } = trpc.diary.getEntries.useQuery(
    { userId: traineeUserId, date: selectedDate },
    { enabled: !!traineeUserId }
  );

  // Chart data extraction
  const weightData = (clientEntries ?? [])
    .filter(e => e.type === 'WEIGHT' && e.weightEntry)
    .map(e => ({ date: e.date as unknown as string, weightKg: e.weightEntry!.weightKg }));

  const measurementData = (clientEntries ?? [])
    .filter(e => e.type === 'MEASUREMENT' && e.measurementEntry)
    .map(e => ({ date: e.date as unknown as string, ...e.measurementEntry! }));

  const nutritionData = (clientEntries ?? [])
    .filter(e => e.type === 'FOOD' && e.foodEntries && e.foodEntries.length > 0)
    .map(e => {
      const foods = e.foodEntries ?? [];
      return {
        date: e.date as unknown as string,
        calories: foods.reduce((sum, f) => sum + f.calories, 0),
        protein: foods.reduce((sum, f) => sum + (f.proteinG ?? 0), 0),
        carbs: foods.reduce((sum, f) => sum + (f.carbsG ?? 0), 0),
        fat: foods.reduce((sum, f) => sum + (f.fatG ?? 0), 0),
      };
    });

  const waterData = (clientEntries ?? [])
    .filter(e => e.type === 'WATER' && e.waterEntry)
    .map(e => ({ date: e.date as unknown as string, totalMl: e.waterEntry!.totalMl }));

  const moodData = (clientEntries ?? [])
    .filter(e => e.type === 'MOOD' && e.moodEntry)
    .map(e => ({ date: e.date as unknown as string, level: e.moodEntry!.level }));

  const sleepData = (clientEntries ?? [])
    .filter(e => e.type === 'SLEEP' && e.sleepEntry)
    .map(e => ({ date: e.date as unknown as string, hoursSlept: e.sleepEntry!.hoursSlept, quality: e.sleepEntry!.quality }));

  const activityData = (clientEntries ?? [])
    .filter(e => e.type === 'ACTIVITY' && e.activityEntry)
    .map(e => ({
      date: e.date as unknown as string,
      activityType: (e as unknown as { activityEntry: { activityType: string } }).activityEntry.activityType,
      distanceKm: (e as unknown as { activityEntry: { distanceKm: number | null } }).activityEntry.distanceKm,
      durationSeconds: (e as unknown as { activityEntry: { durationSeconds: number } }).activityEntry.durationSeconds,
    }));

  const stepsData = (clientEntries ?? [])
    .filter(e => e.type === 'STEPS' && e.stepsEntry)
    .map(e => ({ date: e.date as unknown as string, totalSteps: e.stepsEntry!.totalSteps }));

  return (
    <div className="space-y-6">
      {/* Goals */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              Goals
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => setShowGoalForm(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Create Goal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Dialog open={showGoalForm} onOpenChange={setShowGoalForm}>
            <DialogContent aria-describedby={undefined} className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Goal</DialogTitle>
              </DialogHeader>
              <CreateGoalForm
                clientRosterId={clientRosterId}
                onSuccess={() => setShowGoalForm(false)}
                onCancel={() => setShowGoalForm(false)}
              />
            </DialogContent>
          </Dialog>
          {(clientGoals ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No active goals</p>
          ) : (
            <div className="space-y-3">
              {(clientGoals ?? []).map((goal) => (
                <div key={goal.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{goal.name}</p>
                    <Badge variant="secondary">{goal.type}</Badge>
                  </div>
                  {goal.type === 'TARGET' && goal.targetValue != null && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Current: {goal.currentValue ?? 0} {goal.targetUnit}</span>
                        <span>Target: {goal.targetValue} {goal.targetUnit}</span>
                      </div>
                      <div className="mt-1 h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary transition-all"
                          style={{ width: `${Math.min(((goal.currentValue ?? 0) / goal.targetValue) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {goal.type === 'HABIT' && goal.frequencyPerWeek && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {goal.frequencyPerWeek}x per week
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Bests */}
      <PersonalBests userId={traineeUserId} />

      {/* Charts */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Trends
            </CardTitle>
            <TrendDateRange selectedDays={days} onChange={setDays} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {CHART_TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveChart(key)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeChart === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {activeChart === 'weight' && <WeightChart data={weightData} unitPreference={unitPreference} />}
          {activeChart === 'measurements' && <MeasurementChart data={measurementData} unitPreference={unitPreference} />}
          {activeChart === 'nutrition' && <NutritionChart data={nutritionData} />}
          {activeChart === 'water' && <WaterChart data={waterData} />}
          {activeChart === 'mood' && <MoodChart data={moodData} />}
          {activeChart === 'sleep' && <SleepChart data={sleepData} />}
          {activeChart === 'activity' && <ActivityChart data={activityData} />}
          {activeChart === 'steps' && <StepsChart data={stepsData} />}
        </CardContent>
      </Card>

      {/* Diary Entries — date navigator */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4" />
            Diary Entries
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DiaryDatePicker date={selectedDate} onChange={setSelectedDate} />
          {(dayEntries ?? []).length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">No diary entries for this date</p>
          ) : (
            <DateGroup
              dateKey={selectedDate}
              entries={dayEntries ?? []}
              unitPreference={unitPreference}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// =============================================================================
// DateGroup — entries for a single date with shared comment section
// =============================================================================

const DateGroup = ({ dateKey, entries, unitPreference }: {
  dateKey: string;
  entries: DiaryEntry[];
  unitPreference: 'METRIC' | 'IMPERIAL';
}) => {
  const [commentText, setCommentText] = useState('');
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const addComment = useAddDiaryComment();
  const deleteComment = useDeleteDiaryComment();

  const allComments = entries.flatMap(e =>
    (e.comments ?? []).map(c => ({ ...c, entryId: e.id }))
  ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const firstEntryId = entries[0]?.id;

  const handleSubmitComment = () => {
    if (!commentText.trim() || !firstEntryId) return;
    addComment.mutate(
      { diaryEntryId: firstEntryId, content: commentText.trim() },
      { onSuccess: () => setCommentText('') }
    );
  };

  const entryCount = entries.filter(e => getEntryContent(e, unitPreference) !== null).length;

  return (
    <div className="rounded-lg border">
      {/* Date header */}
      <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5">
        <h3 className="text-sm font-semibold">{formatDateHeading(dateKey)}</h3>
        <Badge variant="secondary" className="text-[10px]">{entryCount} {entryCount === 1 ? 'entry' : 'entries'}</Badge>
      </div>

      {/* Entry list */}
      <div className="divide-y">
        {entries.map((entry) => (
          <EntryRow key={entry.id} entry={entry} unitPreference={unitPreference} />
        ))}
      </div>

      {/* Comments + add comment */}
      <div className="border-t bg-muted/10 px-4 py-3">
        {allComments.length > 0 && (
          <div className="mb-3 space-y-2">
            {allComments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-2">
                <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{comment.content}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {comment.user.name} &middot; {format(new Date(comment.createdAt), 'HH:mm')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteCommentId(comment.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleSubmitComment}
            disabled={!commentText.trim() || addComment.isPending}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {deleteCommentId && (
        <ConfirmDialog
          open={!!deleteCommentId}
          onOpenChange={(open) => !open && setDeleteCommentId(null)}
          title="Delete comment?"
          description="This comment will be permanently removed."
          onConfirm={() => {
            deleteComment.mutate({ id: deleteCommentId });
            setDeleteCommentId(null);
          }}
          isLoading={deleteComment.isPending}
        />
      )}
    </div>
  );
};

// =============================================================================
// EntryRow — single diary entry row with icon
// =============================================================================

const getEntryContent = (entry: DiaryEntry, unitPreference: 'METRIC' | 'IMPERIAL'): { label: string; value: string } | null => {
  switch (entry.type) {
    case 'WEIGHT':
      return entry.weightEntry ? { label: 'Weight', value: formatWeight(entry.weightEntry.weightKg, unitPreference) } : null;
    case 'WATER':
      return entry.waterEntry ? { label: 'Water', value: formatWater(entry.waterEntry.totalMl, unitPreference) } : null;
    case 'MOOD':
      return entry.moodEntry ? { label: 'Mood', value: `${getMoodEmoji(entry.moodEntry.level)} ${entry.moodEntry.level}${entry.moodEntry.notes ? ` — ${entry.moodEntry.notes}` : ''}` } : null;
    case 'SLEEP':
      return entry.sleepEntry ? { label: 'Sleep', value: `${entry.sleepEntry.hoursSlept}h — ${getSleepQualityLabel(entry.sleepEntry.quality)}` } : null;
    case 'FOOD': {
      if (!entry.foodEntries || entry.foodEntries.length === 0) return null;
      const cals = entry.foodEntries.reduce((s, f) => s + f.calories, 0);
      return { label: 'Food', value: `${entry.foodEntries.length} items — ${cals.toLocaleString()} kcal` };
    }
    case 'WORKOUT_LOG': {
      if (!entry.workoutLogEntry) return null;
      const name = entry.workoutLogEntry.workoutPlanName || entry.workoutLogEntry.workoutPlan?.name || 'Freeform';
      return { label: 'Workout', value: `${name} — ${formatDuration(entry.workoutLogEntry.durationMinutes)}${entry.workoutLogEntry.caloriesBurned ? ` (${entry.workoutLogEntry.caloriesBurned} kcal)` : ''}` };
    }
    case 'STEPS':
      return entry.stepsEntry ? { label: 'Steps', value: `${entry.stepsEntry.totalSteps.toLocaleString()} steps` } : null;
    case 'MEASUREMENT': {
      if (!entry.measurementEntry) return null;
      const parts = Object.entries(entry.measurementEntry)
        .filter(([k, v]) => v != null && k.endsWith('Cm'))
        .map(([k, v]) => `${k.replace('Cm', '')}: ${formatMeasurement(v as number, unitPreference)}`);
      return parts.length > 0 ? { label: 'Measurements', value: parts.join(', ') } : null;
    }
    case 'ACTIVITY': {
      if (!entry.activityEntry) return null;
      const act = entry.activityEntry;
      const name = act.activityName || ACTIVITY_TYPE_LABELS[act.activityType] || act.activityType;
      const parts = [formatActivityDuration(act.durationSeconds)];
      if (act.distanceKm != null && act.distanceKm > 0) parts.push(formatDistance(act.distanceKm));
      if (act.avgPaceSecPerKm != null && act.avgPaceSecPerKm > 0) parts.push(formatPace(act.avgPaceSecPerKm));
      return { label: 'Activity', value: `${name} — ${parts.join(', ')}` };
    }
    case 'PROGRESS_PHOTO':
      return entry.progressPhotos && entry.progressPhotos.length > 0
        ? { label: 'Photos', value: `${entry.progressPhotos.length} photo${entry.progressPhotos.length > 1 ? 's' : ''}` }
        : null;
    default:
      return null;
  }
};

const EntryRow = ({ entry, unitPreference }: { entry: DiaryEntry; unitPreference: 'METRIC' | 'IMPERIAL' }) => {
  const content = getEntryContent(entry, unitPreference);
  if (!content) return null;

  const iconInfo = ENTRY_ICONS[entry.type];
  const IconComponent = iconInfo?.icon ?? MessageSquare;
  const iconColor = iconInfo?.color ?? 'text-muted-foreground';

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted ${iconColor}`}>
        <IconComponent className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{content.label}</p>
        <p className="truncate text-sm">{content.value}</p>
      </div>
      {entry.type === 'PROGRESS_PHOTO' && entry.progressPhotos && entry.progressPhotos.length > 0 && (
        <div className="flex gap-1">
          {entry.progressPhotos.slice(0, 3).map(p => (
            <img key={p.id} src={p.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />
          ))}
        </div>
      )}
    </div>
  );
};
