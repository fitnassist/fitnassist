import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { View, ScrollView, Modal, Image, Alert, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { TouchableOpacity } from "react-native";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Play,
  Info,
  Timer,
  Dumbbell,
  SkipForward,
} from "lucide-react-native";
import { useKeepAwake } from "expo-keep-awake";
import { Text, Button, Card, CardContent, Badge } from "@/components/ui";
import { trpc } from "@/lib/trpc";
import { colors } from "@/constants/theme";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SetCompletion {
  exerciseIndex: number;
  setNumber: number;
  completed: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_REST_SECONDS = 60;

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const formatDuration = (ms: number) => {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

const WorkoutRunnerScreen = () => {
  useKeepAwake();

  const { planId } = useLocalSearchParams<{ planId: string }>();
  const router = useRouter();

  // Fetch assignments and find the plan
  const { data: assignments, isLoading } =
    trpc.clientRoster.myAssignments.useQuery();

  const plan = useMemo(() => {
    if (!assignments) return null;
    const rosters = Array.isArray(assignments) ? assignments : [assignments];
    for (const roster of rosters) {
      const wpAssignments = (roster as any)?.workoutPlanAssignments ?? [];
      for (const assignment of wpAssignments) {
        const wp = assignment?.workoutPlan;
        if (wp?.id === planId) return wp;
      }
    }
    return null;
  }, [assignments, planId]);

  const exercises = useMemo(() => plan?.exercises ?? [], [plan]);

  // State
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState<SetCompletion[]>([]);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [workoutStartTime] = useState(Date.now());
  const [showExerciseDetail, setShowExerciseDetail] = useState(false);
  const [showFinishSummary, setShowFinishSummary] = useState(false);
  const [savingNotes, setSavingNotes] = useState("");

  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const logWorkoutMutation = trpc.diary.logWorkout.useMutation();

  const currentExercise = exercises[currentExerciseIndex] as any | undefined;
  const exerciseDetail = currentExercise?.exercise;
  const totalSets = currentExercise?.sets ?? null;
  const restSeconds = currentExercise?.restSeconds ?? DEFAULT_REST_SECONDS;

  // Count completed sets for current exercise
  const completedSetsForCurrent = completedSets.filter(
    (s) => s.exerciseIndex === currentExerciseIndex && s.completed,
  ).length;

  const totalCompletedSets = completedSets.filter((s) => s.completed).length;

  // ---------------------------------------------------------------------------
  // Rest timer
  // ---------------------------------------------------------------------------

  const startRestTimer = useCallback((seconds: number) => {
    setIsResting(true);
    setRestTimeLeft(seconds);
  }, []);

  const skipRest = useCallback(() => {
    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
      restIntervalRef.current = null;
    }
    setIsResting(false);
    setRestTimeLeft(0);
  }, []);

  useEffect(() => {
    if (!isResting) return;

    restIntervalRef.current = setInterval(() => {
      setRestTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(restIntervalRef.current!);
          restIntervalRef.current = null;
          setIsResting(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
        restIntervalRef.current = null;
      }
    };
  }, [isResting]);

  // ---------------------------------------------------------------------------
  // Set completion
  // ---------------------------------------------------------------------------

  const toggleSet = useCallback(
    (setNumber: number) => {
      setCompletedSets((prev) => {
        const existing = prev.find(
          (s) =>
            s.exerciseIndex === currentExerciseIndex &&
            s.setNumber === setNumber,
        );
        if (existing) {
          if (existing.completed) {
            // Unmark
            return prev.map((s) =>
              s.exerciseIndex === currentExerciseIndex &&
              s.setNumber === setNumber
                ? { ...s, completed: false }
                : s,
            );
          }
          // Mark completed
          const updated = prev.map((s) =>
            s.exerciseIndex === currentExerciseIndex &&
            s.setNumber === setNumber
              ? { ...s, completed: true }
              : s,
          );
          // Start rest timer if there are more sets
          if (totalSets && setNumber < totalSets) {
            startRestTimer(restSeconds);
          }
          return updated;
        }
        // First time completing this set
        const newCompletion = {
          exerciseIndex: currentExerciseIndex,
          setNumber,
          completed: true,
        };
        // Start rest timer if there are more sets
        if (totalSets && setNumber < totalSets) {
          startRestTimer(restSeconds);
        }
        return [...prev, newCompletion];
      });
    },
    [currentExerciseIndex, totalSets, restSeconds, startRestTimer],
  );

  // For exercises with no sets
  const markExerciseDone = useCallback(() => {
    setCompletedSets((prev) => {
      const existing = prev.find(
        (s) => s.exerciseIndex === currentExerciseIndex && s.setNumber === 1,
      );
      if (existing) return prev;
      return [
        ...prev,
        { exerciseIndex: currentExerciseIndex, setNumber: 1, completed: true },
      ];
    });
  }, [currentExerciseIndex]);

  const isExerciseDone = totalSets
    ? completedSetsForCurrent >= totalSets
    : completedSets.some(
        (s) => s.exerciseIndex === currentExerciseIndex && s.completed,
      );

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  const goToNextExercise = useCallback(() => {
    skipRest();
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex((i) => i + 1);
    } else {
      setShowFinishSummary(true);
    }
  }, [currentExerciseIndex, exercises.length, skipRest]);

  const goToPreviousExercise = useCallback(() => {
    skipRest();
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex((i) => i - 1);
    }
  }, [currentExerciseIndex, skipRest]);

  const confirmQuit = useCallback(() => {
    Alert.alert("Quit Workout?", "Your progress will be lost.", [
      { text: "Cancel", style: "cancel" },
      { text: "Quit", style: "destructive", onPress: () => router.back() },
    ]);
  }, [router]);

  // ---------------------------------------------------------------------------
  // Save workout
  // ---------------------------------------------------------------------------

  const handleSave = useCallback(async () => {
    const durationMinutes = Math.max(
      1,
      Math.round((Date.now() - workoutStartTime) / 60000),
    );
    const today = new Date().toISOString().split("T")[0];

    try {
      await logWorkoutMutation.mutateAsync({
        date: today,
        workoutPlanId: planId,
        workoutPlanName: plan?.name,
        durationMinutes,
        notes: savingNotes || undefined,
      });
      router.back();
    } catch {
      Alert.alert("Error", "Failed to save workout. Please try again.");
    }
  }, [
    workoutStartTime,
    planId,
    plan?.name,
    savingNotes,
    logWorkoutMutation,
    router,
  ]);

  const handleDiscard = useCallback(() => {
    router.back();
  }, [router]);

  // ---------------------------------------------------------------------------
  // Loading / empty states
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted-foreground">Loading workout...</Text>
      </SafeAreaView>
    );
  }

  if (!plan) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-lg font-semibold text-foreground mb-2">
          Plan not found
        </Text>
        <Text className="text-sm text-muted-foreground text-center mb-4">
          This workout plan could not be loaded.
        </Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </SafeAreaView>
    );
  }

  if (exercises.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-6">
        <Dumbbell size={48} color={colors.mutedForeground} />
        <Text className="text-lg font-semibold text-foreground mt-4 mb-2">
          No Exercises
        </Text>
        <Text className="text-sm text-muted-foreground text-center mb-4">
          This plan does not have any exercises yet.
        </Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Finish summary
  // ---------------------------------------------------------------------------

  if (showFinishSummary) {
    const durationMs = Date.now() - workoutStartTime;
    const exercisesCompleted = new Set(
      completedSets.filter((s) => s.completed).map((s) => s.exerciseIndex),
    ).size;

    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScrollView contentContainerClassName="px-6 py-8 gap-6 items-center">
          <View className="items-center gap-2">
            <View className="w-16 h-16 rounded-full bg-teal/20 items-center justify-center mb-2">
              <Check size={32} color={colors.teal} />
            </View>
            <Text className="text-2xl font-bold text-foreground">
              Workout Complete
            </Text>
            <Text className="text-sm text-muted-foreground">{plan.name}</Text>
          </View>

          <Card className="w-full">
            <CardContent className="py-4 px-4 gap-3">
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted-foreground">Duration</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {formatDuration(durationMs)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted-foreground">Exercises</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {exercisesCompleted} of {exercises.length}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted-foreground">
                  Sets Completed
                </Text>
                <Text className="text-sm font-semibold text-foreground">
                  {totalCompletedSets}
                </Text>
              </View>
            </CardContent>
          </Card>

          <View className="w-full gap-3">
            <Button onPress={handleSave} loading={logWorkoutMutation.isPending}>
              Save to Diary
            </Button>
            <Button variant="ghost" onPress={handleDiscard}>
              Discard
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Rest timer overlay
  // ---------------------------------------------------------------------------

  const restTimerOverlay = isResting ? (
    <Modal transparent animationType="fade" visible>
      <View className="flex-1 bg-black/80 items-center justify-center px-6">
        <Text
          className="text-sm font-medium text-teal uppercase mb-2"
          style={{ letterSpacing: 1 }}
        >
          Rest
        </Text>
        <Text className="text-6xl font-bold text-foreground mb-2">
          {formatTime(restTimeLeft)}
        </Text>

        {/* Circular progress */}
        <View className="w-40 h-3 bg-muted rounded-full overflow-hidden mb-6 mt-2">
          <View
            className="h-full bg-teal rounded-full"
            style={{
              width: `${((restSeconds - restTimeLeft) / restSeconds) * 100}%`,
            }}
          />
        </View>

        <Text className="text-sm text-muted-foreground mb-6">
          Next: Set {completedSetsForCurrent + 1} of {totalSets ?? 1}
        </Text>

        <Button variant="outline" onPress={skipRest}>
          <View className="flex-row items-center gap-2">
            <SkipForward size={16} color={colors.foreground} />
            <Text className="text-sm font-semibold text-foreground">
              Skip Rest
            </Text>
          </View>
        </Button>
      </View>
    </Modal>
  ) : null;

  // ---------------------------------------------------------------------------
  // Exercise detail modal
  // ---------------------------------------------------------------------------

  const exerciseDetailModal =
    showExerciseDetail && exerciseDetail ? (
      <Modal animationType="slide" visible>
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
            <Text className="text-base font-semibold text-foreground">
              {exerciseDetail.name}
            </Text>
            <TouchableOpacity onPress={() => setShowExerciseDetail(false)}>
              <X size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerClassName="px-4 py-4 gap-4 pb-8">
            {exerciseDetail.thumbnailUrl ? (
              <Image
                source={{ uri: exerciseDetail.thumbnailUrl }}
                className="w-full h-52 rounded-lg"
                resizeMode="cover"
              />
            ) : null}

            {exerciseDetail.videoUrl || exerciseDetail.videoUploadUrl ? (
              <TouchableOpacity
                className="flex-row items-center gap-2 bg-muted rounded-lg px-4 py-3"
                onPress={() => {
                  const url =
                    exerciseDetail.videoUrl || exerciseDetail.videoUploadUrl;
                  if (url) Linking.openURL(url);
                }}
              >
                <Play size={18} color={colors.teal} />
                <Text className="text-sm font-medium text-teal">
                  Watch Video
                </Text>
              </TouchableOpacity>
            ) : null}

            {exerciseDetail.description ? (
              <View className="gap-1">
                <Text
                  className="text-xs font-medium text-muted-foreground uppercase"
                  style={{ letterSpacing: 1 }}
                >
                  Description
                </Text>
                <Text className="text-sm text-foreground leading-5">
                  {exerciseDetail.description}
                </Text>
              </View>
            ) : null}

            {exerciseDetail.instructions ? (
              <View className="gap-1">
                <Text
                  className="text-xs font-medium text-muted-foreground uppercase"
                  style={{ letterSpacing: 1 }}
                >
                  Instructions
                </Text>
                <Text className="text-sm text-foreground leading-5">
                  {exerciseDetail.instructions}
                </Text>
              </View>
            ) : null}

            {exerciseDetail.muscleGroups?.length > 0 ? (
              <View className="gap-2">
                <Text
                  className="text-xs font-medium text-muted-foreground uppercase"
                  style={{ letterSpacing: 1 }}
                >
                  Muscle Groups
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {exerciseDetail.muscleGroups.map((mg: string) => (
                    <View
                      key={mg}
                      className="rounded-full px-3 py-1 border border-teal"
                    >
                      <Text className="text-xs font-medium text-teal">
                        {mg.replace(/_/g, " ")}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {exerciseDetail.equipment?.length > 0 ? (
              <View className="gap-2">
                <Text
                  className="text-xs font-medium text-muted-foreground uppercase"
                  style={{ letterSpacing: 1 }}
                >
                  Equipment
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {exerciseDetail.equipment.map((eq: string) => (
                    <View
                      key={eq}
                      className="rounded-full px-3 py-1 border border-teal"
                    >
                      <Text className="text-xs font-medium text-teal">
                        {eq.replace(/_/g, " ")}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {exerciseDetail.difficulty ? (
              <View className="gap-2">
                <Text
                  className="text-xs font-medium text-muted-foreground uppercase"
                  style={{ letterSpacing: 1 }}
                >
                  Difficulty
                </Text>
                <View className="flex-row">
                  <View className="rounded-full px-3 py-1 border border-teal">
                    <Text className="text-xs font-medium text-teal">
                      {exerciseDetail.difficulty.replace(/_/g, " ")}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    ) : null;

  // ---------------------------------------------------------------------------
  // Main exercise view
  // ---------------------------------------------------------------------------

  const progressPercent = totalSets
    ? (completedSetsForCurrent / totalSets) * 100
    : isExerciseDone
      ? 100
      : 0;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Top bar */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <View className="flex-1">
          <Text
            className="text-base font-semibold text-foreground"
            numberOfLines={1}
          >
            {plan.name}
          </Text>
          <Text className="text-xs text-muted-foreground">
            Exercise {currentExerciseIndex + 1} of {exercises.length}
          </Text>
        </View>
        <TouchableOpacity onPress={confirmQuit} className="ml-3">
          <X size={24} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Exercise card */}
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4 gap-4 pb-8"
      >
        <Card>
          <CardContent className="py-5 px-5 gap-4">
            {/* Thumbnail */}
            {exerciseDetail?.thumbnailUrl ? (
              <Image
                source={{ uri: exerciseDetail.thumbnailUrl }}
                className="w-full h-44 rounded-lg"
                resizeMode="cover"
              />
            ) : null}

            {/* Exercise name */}
            <Text className="text-xl font-bold text-foreground">
              {exerciseDetail?.name ?? "Exercise"}
            </Text>

            {/* Sets x Reps info */}
            <View className="gap-1">
              {totalSets ? (
                <View className="flex-row items-center gap-2">
                  <Dumbbell size={14} color={colors.teal} />
                  <Text className="text-sm text-foreground">
                    {totalSets} sets
                    {currentExercise?.reps
                      ? ` x ${currentExercise.reps} reps`
                      : ""}
                  </Text>
                </View>
              ) : currentExercise?.reps ? (
                <View className="flex-row items-center gap-2">
                  <Dumbbell size={14} color={colors.teal} />
                  <Text className="text-sm text-foreground">
                    {currentExercise.reps}
                  </Text>
                </View>
              ) : null}

              <View className="flex-row items-center gap-2">
                <Timer size={14} color={colors.teal} />
                <Text className="text-sm text-muted-foreground">
                  {restSeconds}s rest between sets
                </Text>
              </View>
            </View>

            {/* Trainer notes */}
            {currentExercise?.notes ? (
              <View className="bg-muted rounded-lg px-3 py-2">
                <Text className="text-xs font-medium text-muted-foreground mb-1">
                  Trainer Notes
                </Text>
                <Text className="text-sm text-foreground">
                  {currentExercise.notes}
                </Text>
              </View>
            ) : null}

            {/* View details button */}
            <TouchableOpacity
              className="flex-row items-center gap-2"
              onPress={() => setShowExerciseDetail(true)}
            >
              <Info size={14} color={colors.teal} />
              <Text className="text-sm font-medium text-teal">
                View Details
              </Text>
            </TouchableOpacity>

            {/* Set tracker */}
            {totalSets ? (
              <View className="gap-3">
                <Text
                  className="text-xs font-medium text-muted-foreground uppercase"
                  style={{ letterSpacing: 1 }}
                >
                  Sets
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {Array.from({ length: totalSets }, (_, i) => {
                    const setNumber = i + 1;
                    const isCompleted = completedSets.some(
                      (s) =>
                        s.exerciseIndex === currentExerciseIndex &&
                        s.setNumber === setNumber &&
                        s.completed,
                    );
                    return (
                      <TouchableOpacity
                        key={setNumber}
                        onPress={() => toggleSet(setNumber)}
                        className={`w-12 h-12 rounded-full items-center justify-center border-2 ${
                          isCompleted ? "bg-teal border-teal" : "border-border"
                        }`}
                      >
                        {isCompleted ? (
                          <Check size={20} color={colors.tealForeground} />
                        ) : (
                          <Text className="text-sm font-semibold text-muted-foreground">
                            {setNumber}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : (
              <Button
                variant={isExerciseDone ? "outline" : "default"}
                onPress={markExerciseDone}
                disabled={isExerciseDone}
              >
                {isExerciseDone ? (
                  <View className="flex-row items-center gap-2">
                    <Check size={16} color={colors.teal} />
                    <Text className="text-sm font-semibold text-teal">
                      Done
                    </Text>
                  </View>
                ) : (
                  "Mark as Done"
                )}
              </Button>
            )}

            {/* Progress bar */}
            <View className="h-2 bg-muted rounded-full overflow-hidden">
              <View
                className="h-full bg-teal rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </View>
          </CardContent>
        </Card>
      </ScrollView>

      {/* Bottom controls */}
      <View className="flex-row gap-3 px-4 py-3 border-t border-border">
        <Button
          variant="outline"
          className="flex-1"
          onPress={goToPreviousExercise}
          disabled={currentExerciseIndex === 0}
        >
          <View className="flex-row items-center gap-1">
            <ChevronLeft
              size={16}
              color={
                currentExerciseIndex === 0
                  ? colors.mutedForeground
                  : colors.foreground
              }
            />
            <Text
              className={`text-sm font-semibold ${
                currentExerciseIndex === 0
                  ? "text-muted-foreground"
                  : "text-foreground"
              }`}
            >
              Previous
            </Text>
          </View>
        </Button>

        <Button className="flex-1" onPress={goToNextExercise}>
          <View className="flex-row items-center gap-1">
            <Text className="text-sm font-semibold text-primary-foreground">
              {currentExerciseIndex === exercises.length - 1
                ? "Finish"
                : "Next"}
            </Text>
            {currentExerciseIndex < exercises.length - 1 ? (
              <ChevronRight size={16} color={colors.primaryForeground} />
            ) : null}
          </View>
        </Button>
      </View>

      {restTimerOverlay}
      {exerciseDetailModal}
    </SafeAreaView>
  );
};

export default WorkoutRunnerScreen;
