import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ClipboardList, Plus, Trash2, GripVertical, Search, Dumbbell } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
} from '@/components/ui';
import { PageLayout } from '@/components/layouts';
import { routes } from '@/config/routes';
import {
  useWorkoutPlan,
  useCreateWorkoutPlan,
  useUpdateWorkoutPlan,
  useSetWorkoutExercises,
} from '@/api/workout-plan';
import { useExercises } from '@/api/exercise';
import { createWorkoutPlanSchema } from '@fitnassist/schemas';
import type { CreateWorkoutPlanInput, WorkoutExerciseItem } from '@fitnassist/schemas';

interface PlanExercise {
  tempId: string;
  exerciseId: string;
  exerciseName: string;
  sets: number | null;
  reps: string;
  restSeconds: number | null;
  notes: string;
}

// Sortable exercise row
const SortableExerciseRow = ({
  exercise,
  onUpdate,
  onRemove,
}: {
  exercise: PlanExercise;
  onUpdate: (tempId: string, field: keyof PlanExercise, value: string | number | null) => void;
  onRemove: (tempId: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: exercise.tempId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="border rounded-lg p-3 bg-background">
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-2 cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{exercise.exerciseName}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(exercise.tempId)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Sets</Label>
              <Input
                type="number"
                min={1}
                value={exercise.sets ?? ''}
                onChange={(e) =>
                  onUpdate(
                    exercise.tempId,
                    'sets',
                    e.target.value ? parseInt(e.target.value) : null,
                  )
                }
                placeholder="3"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Reps</Label>
              <Input
                value={exercise.reps}
                onChange={(e) => onUpdate(exercise.tempId, 'reps', e.target.value)}
                placeholder="8-12"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Rest (sec)</Label>
              <Input
                type="number"
                min={0}
                value={exercise.restSeconds ?? ''}
                onChange={(e) =>
                  onUpdate(
                    exercise.tempId,
                    'restSeconds',
                    e.target.value ? parseInt(e.target.value) : null,
                  )
                }
                placeholder="60"
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Notes</Label>
            <Input
              value={exercise.notes}
              onChange={(e) => onUpdate(exercise.tempId, 'notes', e.target.value)}
              placeholder="Optional notes..."
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const WorkoutPlanFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: existing, isLoading: isLoadingPlan } = useWorkoutPlan(id || '');
  const createPlan = useCreateWorkoutPlan();
  const updatePlan = useUpdateWorkoutPlan();
  const setExercises = useSetWorkoutExercises();

  const [isSaving, setIsSaving] = useState(false);
  const [planExercises, setPlanExercises] = useState<PlanExercise[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  // Fetch exercises for the picker
  const { data: exerciseData } = useExercises({ search: exerciseSearch || undefined, limit: 50 });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateWorkoutPlanInput>({
    resolver: zodResolver(createWorkoutPlanSchema),
    defaultValues: { name: '', description: '' },
  });

  // Populate form when editing
  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        description: existing.description ?? '',
      });
      setPlanExercises(
        existing.exercises.map((we, i) => ({
          tempId: `${we.id}-${i}`,
          exerciseId: we.exerciseId,
          exerciseName: we.exercise.name,
          sets: we.sets,
          reps: we.reps ?? '',
          restSeconds: we.restSeconds,
          notes: we.notes ?? '',
        })),
      );
    }
  }, [existing, reset]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPlanExercises((prev) => {
        const oldIndex = prev.findIndex((e) => e.tempId === String(active.id));
        const newIndex = prev.findIndex((e) => e.tempId === String(over.id));
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, []);

  const addExercise = (exercise: { id: string; name: string }) => {
    setPlanExercises((prev) => [
      ...prev,
      {
        tempId: `new-${Date.now()}-${Math.random()}`,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        sets: 3,
        reps: '',
        restSeconds: 60,
        notes: '',
      },
    ]);
    setShowPicker(false);
    setExerciseSearch('');
  };

  const updateExercise = (
    tempId: string,
    field: keyof PlanExercise,
    value: string | number | null,
  ) => {
    setPlanExercises((prev) =>
      prev.map((e) => (e.tempId === tempId ? { ...e, [field]: value } : e)),
    );
  };

  const removeExercise = (tempId: string) => {
    setPlanExercises((prev) => prev.filter((e) => e.tempId !== tempId));
  };

  const onSubmit = async (data: CreateWorkoutPlanInput) => {
    setIsSaving(true);
    try {
      const cleaned = {
        ...data,
        description: data.description || null,
      };

      let planId = id;

      if (isEdit && id) {
        await updatePlan.mutateAsync({ id, ...cleaned });
      } else {
        const newPlan = await createPlan.mutateAsync(cleaned);
        planId = newPlan.id;
      }

      // Save exercises
      if (planId) {
        const exerciseItems: WorkoutExerciseItem[] = planExercises.map((e, i) => ({
          exerciseId: e.exerciseId,
          sets: e.sets,
          reps: e.reps || null,
          restSeconds: e.restSeconds,
          notes: e.notes || null,
          sortOrder: i,
        }));
        await setExercises.mutateAsync({ id: planId, exercises: exerciseItems });
      }

      navigate(`${routes.dashboardResources}?tab=workout-plans`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isEdit && isLoadingPlan) {
    return (
      <PageLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </PageLayout>
    );
  }

  // Filter out exercises already in the plan
  const addedIds = new Set(planExercises.map((e) => e.exerciseId));
  const availableExercises = exerciseData?.exercises.filter((e) => !addedIds.has(e.id)) ?? [];

  return (
    <PageLayout>
      <PageLayout.Header
        title={isEdit ? 'Edit Workout Plan' : 'New Workout Plan'}
        icon={<ClipboardList className="h-6 w-6 sm:h-8 sm:w-8" />}
        backLink={{ to: routes.dashboardResources, label: 'Back to Resources' }}
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...register('name')} placeholder="e.g. Upper Body Strength" />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="What's this workout plan for?"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Exercises */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Exercises ({planExercises.length})</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPicker(!showPicker)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Exercise
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Exercise picker */}
            {showPicker && (
              <div className="border rounded-lg p-3 bg-muted/50 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search your exercises..."
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {availableExercises.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-3">
                    {exerciseData?.exercises.length === 0
                      ? 'No exercises in your library yet. Create some first!'
                      : 'No matching exercises found.'}
                  </p>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {availableExercises.map((exercise) => (
                      <button
                        key={exercise.id}
                        type="button"
                        onClick={() => addExercise(exercise)}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-background text-sm flex items-center gap-2"
                      >
                        <Dumbbell className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{exercise.name}</span>
                        {exercise.difficulty && (
                          <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                            {exercise.difficulty}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Exercise list with drag reorder */}
            {planExercises.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No exercises added yet. Click "Add Exercise" to get started.
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={planExercises.map((e) => e.tempId)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {planExercises.map((exercise) => (
                      <SortableExerciseRow
                        key={exercise.tempId}
                        exercise={exercise}
                        onUpdate={updateExercise}
                        onRemove={removeExercise}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`${routes.dashboardResources}?tab=workout-plans`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Plan'}
          </Button>
        </div>
      </form>
    </PageLayout>
  );
};

export default WorkoutPlanFormPage;
