import { useState, useMemo, lazy, Suspense } from 'react';
import { Bike, Plus, Trash2, Clock, MapPin, Flame, TrendingUp, Heart } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  ConfirmDialog,
  SourceBadge,
} from '@/components/ui';
import { Select } from '@/components/ui';

const ActivityMap = lazy(() =>
  import('@/components/ActivityMap').then((m) => ({ default: m.ActivityMap })),
);
import { useLogActivity, useDeleteDiaryEntry } from '@/api/diary';
import { logActivitySchema, type LogActivityInput } from '@fitnassist/schemas';
import {
  ACTIVITY_TYPE_OPTIONS,
  ACTIVITY_TYPE_LABELS,
  formatActivityDuration,
  formatDistance,
  formatPace,
} from '../../diary.utils';

interface ActivityLoggerProps {
  date: string;
  entries: Array<{
    id: string;
    activityEntry?: {
      activityType: string;
      activityName: string | null;
      distanceKm: number | null;
      durationSeconds: number;
      avgPaceSecPerKm: number | null;
      elevationGainM: number | null;
      caloriesBurned: number | null;
      notes: string | null;
      source?: string;
      routePolyline?: string | null;
      startLatitude?: number | null;
      startLongitude?: number | null;
      endLatitude?: number | null;
      endLongitude?: number | null;
      avgHeartRate?: number | null;
      maxHeartRate?: number | null;
    } | null;
  }>;
}

const activityTypeSelectOptions = ACTIVITY_TYPE_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));

export const ActivityLogger = ({ date, entries }: ActivityLoggerProps) => {
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const logActivity = useLogActivity();
  const deleteEntry = useDeleteDiaryEntry();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LogActivityInput>({
    resolver: zodResolver(logActivitySchema),
    defaultValues: { date, durationSeconds: 1800, activityType: 'RUN' },
  });

  // Duration input as mm:ss
  const [durationMin, setDurationMin] = useState('30');
  const [durationSec, setDurationSec] = useState('00');

  const watchedDistance = watch('distanceKm');

  const updateDurationSeconds = (min: string, sec: string) => {
    const totalSec = parseInt(min || '0') * 60 + parseInt(sec || '0');
    setValue('durationSeconds', totalSec, { shouldValidate: true });
  };

  const computedPace = useMemo(() => {
    const totalSec = parseInt(durationMin || '0') * 60 + parseInt(durationSec || '0');
    if (watchedDistance && watchedDistance > 0 && totalSec > 0) {
      return formatPace(totalSec / watchedDistance);
    }
    return null;
  }, [watchedDistance, durationMin, durationSec]);

  const onSubmit = (data: LogActivityInput) => {
    logActivity.mutate(data, {
      onSuccess: () => {
        reset({ date, durationSeconds: 1800, activityType: 'RUN' });
        setDurationMin('30');
        setDurationSec('00');
        setShowForm(false);
      },
    });
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bike className="h-4 w-4 text-blue-500" />
            Activities
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="h-3.5 w-3.5" />
            Log
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {/* Logged activities list */}
        {entries.length > 0 && (
          <div className="mb-3 space-y-2">
            {entries.map((entry) => {
              const act = entry.activityEntry;
              if (!act) return null;
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg border p-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {act.activityName ||
                          ACTIVITY_TYPE_LABELS[act.activityType] ||
                          act.activityType}
                      </p>
                      <SourceBadge source={act.source ?? ''} />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {act.distanceKm != null && act.distanceKm > 0 && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {formatDistance(act.distanceKm)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatActivityDuration(act.durationSeconds)}
                      </span>
                      {act.avgPaceSecPerKm != null && act.avgPaceSecPerKm > 0 && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {formatPace(act.avgPaceSecPerKm)}
                        </span>
                      )}
                      {act.caloriesBurned != null && act.caloriesBurned > 0 && (
                        <span className="flex items-center gap-1">
                          <Flame className="h-3 w-3" />
                          {act.caloriesBurned} kcal
                        </span>
                      )}
                      {act.avgHeartRate != null && act.avgHeartRate > 0 && (
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {act.avgHeartRate} bpm
                          {act.maxHeartRate ? ` (max ${act.maxHeartRate})` : ''}
                        </span>
                      )}
                    </div>
                    {act.notes && (
                      <p className="mt-1 truncate text-xs text-muted-foreground">{act.notes}</p>
                    )}
                    {act.routePolyline && (
                      <Suspense
                        fallback={
                          <div className="mt-2 h-[240px] rounded-lg bg-muted animate-pulse" />
                        }
                      >
                        <ActivityMap
                          routePolyline={act.routePolyline}
                          startLatitude={act.startLatitude}
                          startLongitude={act.startLongitude}
                          endLatitude={act.endLatitude}
                          endLongitude={act.endLongitude}
                          className="mt-2"
                        />
                      </Suspense>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteId(entry.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {entries.length === 0 && !showForm && (
          <p className="text-center text-sm text-muted-foreground">No activities logged</p>
        )}

        {/* Log activity form */}
        {showForm && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <input type="hidden" {...register('date')} value={date} />

            <div>
              <label className="mb-1 block text-xs font-medium">Activity Type</label>
              <Controller
                name="activityType"
                control={control}
                render={({ field }) => (
                  <Select
                    options={activityTypeSelectOptions}
                    value={activityTypeSelectOptions.find((o) => o.value === field.value) ?? null}
                    onChange={(opt) => field.onChange(opt?.value ?? 'RUN')}
                    placeholder="Select type..."
                  />
                )}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium">Name (optional)</label>
              <Input placeholder="e.g. Morning jog" {...register('activityName')} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium">Distance (km)</label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Optional"
                  {...register('distanceKm', {
                    setValueAs: (v) => (v === '' ? undefined : Number(v)),
                  })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Duration (mm:ss)</label>
                <div className="flex gap-1">
                  <Input
                    type="number"
                    min={0}
                    placeholder="min"
                    value={durationMin}
                    onChange={(e) => {
                      setDurationMin(e.target.value);
                      updateDurationSeconds(e.target.value, durationSec);
                    }}
                  />
                  <span className="flex items-center text-sm">:</span>
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    placeholder="sec"
                    value={durationSec}
                    onChange={(e) => {
                      setDurationSec(e.target.value);
                      updateDurationSeconds(durationMin, e.target.value);
                    }}
                  />
                </div>
                {errors.durationSeconds && (
                  <p className="mt-0.5 text-xs text-destructive">
                    {errors.durationSeconds.message}
                  </p>
                )}
              </div>
            </div>

            {computedPace && <p className="text-xs text-muted-foreground">Pace: {computedPace}</p>}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium">Elevation (m)</label>
                <Input
                  type="number"
                  min={0}
                  placeholder="Optional"
                  {...register('elevationGainM', {
                    setValueAs: (v) => (v === '' ? undefined : Number(v)),
                  })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Calories burned</label>
                <Input
                  type="number"
                  min={0}
                  placeholder="Optional"
                  {...register('caloriesBurned', {
                    setValueAs: (v) => (v === '' ? undefined : Number(v)),
                  })}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium">Notes</label>
              <Input placeholder="Optional notes..." {...register('notes')} />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={logActivity.isPending}>
                {logActivity.isPending ? 'Saving...' : 'Save Activity'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {deleteId && (
          <ConfirmDialog
            open={!!deleteId}
            onOpenChange={(open) => !open && setDeleteId(null)}
            title="Delete activity?"
            description="This activity log will be permanently removed."
            onConfirm={() => {
              deleteEntry.mutate({ id: deleteId });
              setDeleteId(null);
            }}
            isLoading={deleteEntry.isPending}
          />
        )}
      </CardContent>
    </Card>
  );
};
