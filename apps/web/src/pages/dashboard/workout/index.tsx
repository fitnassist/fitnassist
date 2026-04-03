import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Dumbbell, Timer, Eye, SkipForward, Trophy, X, Play } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  Input,
  Textarea,
  Checkbox,
} from '@/components/ui';
import { useMyAssignments } from '@/api/client-roster';
import { useLogWorkout } from '@/api/diary';
import { routes } from '@/config/routes';

// =============================================================================
// TYPES
// =============================================================================

interface ExerciseDetail {
  name: string;
  description?: string | null;
  instructions?: string | null;
  videoUrl?: string | null;
  videoUploadUrl?: string | null;
  thumbnailUrl?: string | null;
  muscleGroups?: string[];
  equipment?: string[];
  difficulty?: string | null;
}

interface WorkoutExercise {
  id: string;
  sets?: number | null;
  reps?: string | null;
  restSeconds?: number | null;
  notes?: string | null;
  exercise: ExerciseDetail;
}

interface WorkoutPlan {
  id: string;
  name: string;
  description?: string | null;
  exercises: WorkoutExercise[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

const MUSCLE_GROUP_LABELS: Record<string, string> = {
  CHEST: 'Chest',
  BACK: 'Back',
  SHOULDERS: 'Shoulders',
  BICEPS: 'Biceps',
  TRICEPS: 'Triceps',
  FOREARMS: 'Forearms',
  ABS: 'Abs',
  OBLIQUES: 'Obliques',
  QUADS: 'Quads',
  HAMSTRINGS: 'Hamstrings',
  GLUTES: 'Glutes',
  CALVES: 'Calves',
  TRAPS: 'Traps',
  LATS: 'Lats',
  LOWER_BACK: 'Lower Back',
  HIP_FLEXORS: 'Hip Flexors',
  ADDUCTORS: 'Adductors',
  ABDUCTORS: 'Abductors',
  FULL_BODY: 'Full Body',
  CARDIO: 'Cardio',
};

const DEFAULT_REST_SECONDS = 60;

// =============================================================================
// HELPERS
// =============================================================================

const formatTime = (totalSeconds: number): string => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
};

const extractVimeoId = (url: string): string | null => {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match?.[1] ?? null;
};

// =============================================================================
// HOOKS
// =============================================================================

const useElapsedTimer = () => {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const stop = useCallback(() => setIsRunning(false), []);

  return { elapsed, stop };
};

const useRestTimer = () => {
  const [activeTimer, setActiveTimer] = useState<{
    exerciseId: string;
    remaining: number;
  } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (activeTimer && activeTimer.remaining > 0) {
      intervalRef.current = setInterval(() => {
        setActiveTimer((prev) => {
          if (!prev || prev.remaining <= 1) {
            return null;
          }
          return { ...prev, remaining: prev.remaining - 1 };
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [
    activeTimer?.exerciseId,
    activeTimer?.remaining !== undefined ? activeTimer.remaining > 0 : false,
  ]);

  const startTimer = useCallback((exerciseId: string, seconds: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActiveTimer({ exerciseId, remaining: seconds });
  }, []);

  const skipTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActiveTimer(null);
  }, []);

  return { activeTimer, startTimer, skipTimer };
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const VideoEmbed = ({ url }: { url: string }) => {
  const youtubeId = extractYouTubeId(url);
  const vimeoId = extractVimeoId(url);

  if (youtubeId) {
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title="Exercise video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  if (vimeoId) {
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden">
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}`}
          title="Exercise video"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
    >
      <Play className="h-4 w-4" />
      Watch Video
    </a>
  );
};

const ExerciseDetailDialog = ({
  open,
  onOpenChange,
  exercise,
  sets,
  reps,
  restSeconds,
  notes,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise: ExerciseDetail;
  sets?: number | null;
  reps?: string | null;
  restSeconds?: number | null;
  notes?: string | null;
}) => {
  const videoUrl = exercise.videoUrl || exercise.videoUploadUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{exercise.name}</DialogTitle>
          <DialogDescription className="sr-only">
            Detailed information about the {exercise.name} exercise
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {videoUrl && <VideoEmbed url={videoUrl} />}

          {exercise.thumbnailUrl && !videoUrl && (
            <img
              src={exercise.thumbnailUrl}
              alt={exercise.name}
              className="w-full rounded-lg object-cover max-h-48"
            />
          )}

          {(sets || reps || restSeconds) && (
            <div className="flex flex-wrap gap-2">
              {sets && <Badge variant="secondary">{sets} sets</Badge>}
              {reps && <Badge variant="secondary">{reps} reps</Badge>}
              {restSeconds && <Badge variant="secondary">{restSeconds}s rest</Badge>}
            </div>
          )}

          {notes && (
            <div>
              <p className="text-sm font-medium mb-1">Trainer Notes</p>
              <p className="text-sm text-muted-foreground italic">{notes}</p>
            </div>
          )}

          {exercise.description && (
            <div>
              <p className="text-sm font-medium mb-1">Description</p>
              <p className="text-sm text-muted-foreground">{exercise.description}</p>
            </div>
          )}

          {exercise.instructions && (
            <div>
              <p className="text-sm font-medium mb-1">Instructions</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {exercise.instructions}
              </p>
            </div>
          )}

          {exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">Muscle Groups</p>
              <div className="flex flex-wrap gap-1.5">
                {exercise.muscleGroups.map((mg) => (
                  <Badge key={mg} variant="outline">
                    {MUSCLE_GROUP_LABELS[mg] ?? mg}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {exercise.equipment && exercise.equipment.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">Equipment</p>
              <div className="flex flex-wrap gap-1.5">
                {exercise.equipment.map((eq) => (
                  <Badge key={eq} variant="outline">
                    {eq}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {exercise.difficulty && (
            <div>
              <p className="text-sm font-medium mb-1">Difficulty</p>
              <Badge variant="outline">{exercise.difficulty}</Badge>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const RestTimerDisplay = ({ remaining, onSkip }: { remaining: number; onSkip: () => void }) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg mt-3 animate-in fade-in">
      <Timer className="h-5 w-5 text-primary animate-pulse" />
      <span className="text-lg font-mono font-semibold tabular-nums">{formatTime(remaining)}</span>
      <span className="text-sm text-muted-foreground">rest</span>
      <Button variant="ghost" size="sm" onClick={onSkip} className="ml-auto">
        <SkipForward className="h-4 w-4 mr-1" />
        Skip
      </Button>
    </div>
  );
};

const ExerciseCard = ({
  index,
  workoutExercise,
  completedSets,
  onToggleSet,
  restTimer,
  onSkipRest,
  onViewExercise,
}: {
  index: number;
  workoutExercise: WorkoutExercise;
  completedSets: boolean[];
  onToggleSet: (setIndex: number) => void;
  restTimer: { remaining: number } | null;
  onSkipRest: () => void;
  onViewExercise: () => void;
}) => {
  const { exercise, sets, reps, restSeconds, notes } = workoutExercise;
  const totalSets = sets ?? 1;
  const completedCount = completedSets.filter(Boolean).length;
  const allComplete = completedCount === totalSets;

  return (
    <Card className={allComplete ? 'border-primary/30 bg-primary/5' : ''}>
      <CardContent className="p-4 sm:p-5">
        {/* Exercise header */}
        <div className="flex items-start gap-3 mb-4">
          <span
            className={`flex-shrink-0 w-7 h-7 rounded-full text-xs flex items-center justify-center font-semibold ${
              allComplete ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
            }`}
          >
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base">{exercise.name}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {sets && reps && (
                <span className="text-sm text-muted-foreground">
                  {sets} x {reps}
                </span>
              )}
              {!sets && reps && <span className="text-sm text-muted-foreground">{reps}</span>}
              {sets && !reps && <span className="text-sm text-muted-foreground">{sets} sets</span>}
              {restSeconds && (
                <span className="text-sm text-muted-foreground">{restSeconds}s rest</span>
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                {completedCount}/{totalSets} sets
              </span>
            </div>
          </div>
        </div>

        {/* Thumbnail */}
        {exercise.thumbnailUrl && (
          <img
            src={exercise.thumbnailUrl}
            alt={exercise.name}
            className="w-full rounded-lg object-cover max-h-32 mb-4"
          />
        )}

        {/* Trainer notes */}
        {notes && (
          <p className="text-sm text-muted-foreground italic mb-4 pl-2 border-l-2 border-primary/30">
            {notes}
          </p>
        )}

        {/* Set checkboxes */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-medium text-muted-foreground mr-1">Sets:</span>
          {Array.from({ length: totalSets }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onToggleSet(i)}
              className="flex items-center gap-1.5 group"
              aria-label={`Set ${i + 1} - ${completedSets[i] ? 'completed' : 'incomplete'}`}
            >
              <Checkbox
                checked={completedSets[i]}
                onCheckedChange={() => onToggleSet(i)}
                className={
                  completedSets[i]
                    ? 'border-primary bg-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary'
                    : ''
                }
                aria-label={`Set ${i + 1}`}
              />
              <span
                className={`text-xs ${completedSets[i] ? 'text-primary font-medium' : 'text-muted-foreground'}`}
              >
                {i + 1}
              </span>
            </button>
          ))}
        </div>

        {/* Rest timer */}
        {restTimer && <RestTimerDisplay remaining={restTimer.remaining} onSkip={onSkipRest} />}

        {/* View exercise button */}
        <Button variant="ghost" size="sm" className="mt-2" onClick={onViewExercise}>
          <Eye className="h-4 w-4 mr-1.5" />
          View Exercise
        </Button>
      </CardContent>
    </Card>
  );
};

const FinishDialog = ({
  open,
  onOpenChange,
  elapsedSeconds,
  exerciseCount,
  completedSetCount,
  totalSetCount,
  planId,
  planName,
  onDiscard,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  elapsedSeconds: number;
  exerciseCount: number;
  completedSetCount: number;
  totalSetCount: number;
  planId: string;
  planName: string;
  onDiscard: () => void;
}) => {
  const [notes, setNotes] = useState('');
  const [calories, setCalories] = useState('');
  const navigate = useNavigate();
  const logWorkout = useLogWorkout();

  const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

  const handleSave = () => {
    logWorkout.mutate(
      {
        date: format(new Date(), 'yyyy-MM-dd'),
        workoutPlanId: planId,
        workoutPlanName: planName,
        durationMinutes,
        notes: notes || undefined,
        caloriesBurned: calories ? parseInt(calories, 10) : undefined,
      },
      {
        onSuccess: () => {
          navigate(routes.dashboardMyPlans);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Workout Complete
          </DialogTitle>
          <DialogDescription>Review your workout summary and save to your diary.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="text-lg font-semibold">{formatTime(elapsedSeconds)}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Exercises</p>
              <p className="text-lg font-semibold">{exerciseCount}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Sets</p>
              <p className="text-lg font-semibold">
                {completedSetCount}/{totalSetCount}
              </p>
            </div>
          </div>

          {/* Optional notes */}
          <div>
            <label htmlFor="workout-notes" className="text-sm font-medium mb-1.5 block">
              Notes (optional)
            </label>
            <Textarea
              id="workout-notes"
              placeholder="How did the workout feel?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Optional calories */}
          <div>
            <label htmlFor="workout-calories" className="text-sm font-medium mb-1.5 block">
              Calories burned (optional)
            </label>
            <Input
              id="workout-calories"
              type="number"
              placeholder="e.g. 350"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              min={0}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onDiscard} className="sm:mr-auto">
            Discard
          </Button>
          <Button onClick={handleSave} disabled={logWorkout.isPending}>
            {logWorkout.isPending ? 'Saving...' : 'Save to Diary'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export const WorkoutRunnerPage = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { data: assignments, isLoading } = useMyAssignments();
  const { elapsed, stop } = useElapsedTimer();
  const { activeTimer, startTimer, skipTimer } = useRestTimer();

  // Track completed sets per exercise: { [exerciseId]: boolean[] }
  const [completedSets, setCompletedSets] = useState<Record<string, boolean[]>>({});
  const [showFinish, setShowFinish] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<WorkoutExercise | null>(null);

  // Find the workout plan from assignments
  const plan: WorkoutPlan | null = (() => {
    if (!assignments || !planId) return null;
    for (const a of assignments) {
      for (const wpa of a.workoutPlanAssignments ?? []) {
        if (wpa.workoutPlan.id === planId) {
          return wpa.workoutPlan as WorkoutPlan;
        }
      }
    }
    return null;
  })();

  // Initialize completed sets when plan loads
  useEffect(() => {
    if (plan && Object.keys(completedSets).length === 0) {
      const initial: Record<string, boolean[]> = {};
      for (const we of plan.exercises) {
        const totalSets = we.sets ?? 1;
        initial[we.id] = Array(totalSets).fill(false);
      }
      setCompletedSets(initial);
    }
  }, [plan, completedSets]);

  const handleToggleSet = useCallback(
    (exerciseId: string, setIndex: number, restSeconds: number | null | undefined) => {
      setCompletedSets((prev) => {
        const current = [...(prev[exerciseId] ?? [])];
        const wasComplete = current[setIndex];
        current[setIndex] = !wasComplete;

        // Start rest timer when checking a set (not unchecking)
        if (!wasComplete) {
          const rest = restSeconds ?? DEFAULT_REST_SECONDS;
          startTimer(exerciseId, rest);
        }

        return { ...prev, [exerciseId]: current };
      });
    },
    [startTimer],
  );

  const handleEndWorkout = useCallback(() => {
    stop();
    setShowFinish(true);
  }, [stop]);

  const handleDiscard = useCallback(() => {
    navigate(routes.dashboardMyPlans);
  }, [navigate]);

  // Check if all sets are complete
  const allSetsComplete =
    plan &&
    Object.keys(completedSets).length > 0 &&
    plan.exercises.every((we) => {
      const sets = completedSets[we.id];
      return sets && sets.every(Boolean);
    });

  // Auto-show finish dialog when all sets complete
  useEffect(() => {
    if (allSetsComplete && !showFinish) {
      stop();
      setShowFinish(true);
    }
  }, [allSetsComplete, showFinish, stop]);

  // Calculate totals for finish dialog
  const totalSets = plan ? plan.exercises.reduce((sum, we) => sum + (we.sets ?? 1), 0) : 0;
  const completedSetCount = Object.values(completedSets).reduce(
    (sum, sets) => sum + sets.filter(Boolean).length,
    0,
  );
  const exercisesWithCompletedSets = Object.values(completedSets).filter((sets) =>
    sets.some(Boolean),
  ).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-muted rounded" />
            <div className="h-48 bg-muted rounded" />
            <div className="h-48 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto text-center py-20">
          <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Workout plan not found</h2>
          <p className="text-sm text-muted-foreground mb-6">
            This plan may have been unassigned or removed.
          </p>
          <Button onClick={() => navigate(routes.dashboardMyPlans)}>Back to My Plans</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Dumbbell className="h-5 w-5 text-primary flex-shrink-0" />
            <h1 className="font-semibold text-base truncate">{plan.name}</h1>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-sm font-mono tabular-nums">
              <Timer className="h-4 w-4 text-muted-foreground" />
              {formatTime(elapsed)}
            </div>
            <Button variant="destructive" size="sm" onClick={handleEndWorkout}>
              <X className="h-4 w-4 mr-1" />
              End
            </Button>
          </div>
        </div>
      </div>

      {/* Exercise list */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 pb-24">
        {plan.exercises.map((we, i) => (
          <ExerciseCard
            key={we.id}
            index={i}
            workoutExercise={we}
            completedSets={completedSets[we.id] ?? []}
            onToggleSet={(setIndex) => handleToggleSet(we.id, setIndex, we.restSeconds)}
            restTimer={
              activeTimer?.exerciseId === we.id ? { remaining: activeTimer.remaining } : null
            }
            onSkipRest={skipTimer}
            onViewExercise={() => setSelectedExercise(we)}
          />
        ))}

        {/* End workout button at bottom */}
        <div className="pt-4">
          <Button className="w-full" size="lg" onClick={handleEndWorkout}>
            <Trophy className="h-5 w-5 mr-2" />
            End Workout
          </Button>
        </div>
      </div>

      {/* Exercise detail dialog */}
      {selectedExercise && (
        <ExerciseDetailDialog
          open={!!selectedExercise}
          onOpenChange={(open) => !open && setSelectedExercise(null)}
          exercise={selectedExercise.exercise}
          sets={selectedExercise.sets}
          reps={selectedExercise.reps}
          restSeconds={selectedExercise.restSeconds}
          notes={selectedExercise.notes}
        />
      )}

      {/* Finish dialog */}
      {planId && (
        <FinishDialog
          open={showFinish}
          onOpenChange={setShowFinish}
          elapsedSeconds={elapsed}
          exerciseCount={exercisesWithCompletedSets}
          completedSetCount={completedSetCount}
          totalSetCount={totalSets}
          planId={planId}
          planName={plan.name}
          onDiscard={handleDiscard}
        />
      )}
    </div>
  );
};

export default WorkoutRunnerPage;
