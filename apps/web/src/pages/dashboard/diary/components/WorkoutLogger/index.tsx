import { useState } from 'react';
import { Dumbbell, Plus, Trash2, Clock, Flame } from 'lucide-react';
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
} from '@/components/ui';
import { Select } from '@/components/ui';
import { useLogWorkout, useMyWorkoutPlans, useDeleteDiaryEntry } from '@/api/diary';
import { logWorkoutSchema, type LogWorkoutInput } from '@fitnassist/schemas';
import { formatDuration } from '../../diary.utils';

interface WorkoutLoggerProps {
  date: string;
  entries: Array<{
    id: string;
    workoutLogEntry?: {
      workoutPlanId: string | null;
      workoutPlanName: string | null;
      durationMinutes: number;
      caloriesBurned: number | null;
      notes: string | null;
      workoutPlan?: { id: string; name: string } | null;
    } | null;
  }>;
}

export const WorkoutLogger = ({ date, entries }: WorkoutLoggerProps) => {
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const logWorkout = useLogWorkout();
  const deleteEntry = useDeleteDiaryEntry();
  const { data: workoutPlans } = useMyWorkoutPlans();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<LogWorkoutInput>({
    resolver: zodResolver(logWorkoutSchema),
    defaultValues: { date, durationMinutes: 30 },
  });

  const planOptions = (workoutPlans ?? []).map((p) => ({ value: p.id, label: p.name }));

  const onSubmit = (data: LogWorkoutInput) => {
    logWorkout.mutate(data, {
      onSuccess: () => {
        reset({ date, durationMinutes: 30 });
        setShowForm(false);
      },
    });
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Dumbbell className="h-4 w-4 text-violet-500" />
            Workouts
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
        {/* Logged workouts list */}
        {entries.length > 0 && (
          <div className="mb-3 space-y-2">
            {entries.map((entry) => {
              const log = entry.workoutLogEntry;
              if (!log) return null;
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg border p-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {log.workoutPlanName || log.workoutPlan?.name || 'Freeform Workout'}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(log.durationMinutes)}
                      </span>
                      {log.caloriesBurned != null && log.caloriesBurned > 0 && (
                        <span className="flex items-center gap-1">
                          <Flame className="h-3 w-3" />
                          {log.caloriesBurned} kcal
                        </span>
                      )}
                    </div>
                    {log.notes && (
                      <p className="mt-1 truncate text-xs text-muted-foreground">{log.notes}</p>
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
          <p className="text-center text-sm text-muted-foreground">No workouts logged</p>
        )}

        {/* Log workout form */}
        {showForm && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <input type="hidden" {...register('date')} value={date} />

            {planOptions.length > 0 && (
              <div>
                <label htmlFor="workout-plan" className="mb-1 block text-xs font-medium">
                  Workout Plan (optional)
                </label>
                <Controller
                  name="workoutPlanId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      inputId="workout-plan"
                      options={planOptions}
                      value={planOptions.find((o) => o.value === field.value) ?? null}
                      onChange={(opt) => {
                        field.onChange(opt?.value ?? undefined);
                        if (opt) {
                          setValue('workoutPlanName', opt.label);
                        }
                      }}
                      isClearable
                      placeholder="Select plan..."
                    />
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium">Duration (min)</label>
                <Input
                  type="number"
                  min={1}
                  {...register('durationMinutes', { valueAsNumber: true })}
                />
                {errors.durationMinutes && (
                  <p className="mt-0.5 text-xs text-destructive">
                    {errors.durationMinutes.message}
                  </p>
                )}
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
              <Button type="submit" className="flex-1" disabled={logWorkout.isPending}>
                {logWorkout.isPending ? 'Saving...' : 'Save Workout'}
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
            title="Delete workout entry?"
            description="This workout log will be permanently removed."
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
