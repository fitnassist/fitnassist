import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import { appleHealth } from "@/lib/apple-health";
import { trpc } from "@/lib/trpc";

// Map Apple workout types to our activity types
const workoutTypeMap: Record<number, string> = {
  37: "RUN", // HKWorkoutActivityType.running
  13: "CYCLE", // HKWorkoutActivityType.cycling
  52: "WALK", // HKWorkoutActivityType.walking
  24: "HIKE", // HKWorkoutActivityType.hiking
  46: "SWIM", // HKWorkoutActivityType.swimming
};

export const useAppleHealthSync = () => {
  const { data: connections } = trpc.integration.list.useQuery(undefined, {
    enabled: Platform.OS === "ios",
  });
  const lastSyncRef = useRef<number>(0);

  // tRPC mutations
  const logSteps = trpc.diary.logSteps.useMutation();
  const logActivity = trpc.diary.logActivity.useMutation();
  const logSleep = trpc.diary.logSleep.useMutation();
  const logWeight = trpc.diary.logWeight.useMutation();

  const isConnected = connections?.some(
    (c: any) => c.provider === "APPLE_HEALTH" && c.status === "CONNECTED",
  );

  const syncPrefs = connections?.find((c: any) => c.provider === "APPLE_HEALTH")
    ?.syncPreferences as any;

  const sync = async () => {
    if (!isConnected || Platform.OS !== "ios") return;

    // Rate limit — max once per 5 minutes
    const now = Date.now();
    if (now - lastSyncRef.current < 5 * 60 * 1000) return;
    lastSyncRef.current = now;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - 24);
    const today = endDate.toISOString().split("T")[0]!;

    try {
      // Steps
      if (syncPrefs?.steps !== false) {
        const steps = await appleHealth.getDailySteps(new Date());
        if (steps > 0) {
          logSteps.mutate({
            date: today,
            totalSteps: Math.round(steps),
            source: "APPLE_HEALTH" as any,
          });
        }
      }

      // Workouts
      if (syncPrefs?.activities !== false) {
        const workouts = await appleHealth.getWorkouts(startDate, endDate);
        for (const w of workouts) {
          const activityType = workoutTypeMap[w.activityId] || "OTHER";
          const durationSeconds = Math.round(
            (new Date(w.end).getTime() - new Date(w.start).getTime()) / 1000,
          );
          if (durationSeconds > 0) {
            logActivity.mutate({
              date: new Date(w.start).toISOString().split("T")[0]!,
              activityType: activityType as any,
              durationSeconds,
              distanceKm: w.distance ? w.distance / 1000 : undefined,
              caloriesBurned: w.calories ? Math.round(w.calories) : undefined,
              source: "APPLE_HEALTH" as any,
              externalId: `apple_health_workout_${w.id || w.start}`,
            } as any);
          }
        }
      }

      // Sleep
      if (syncPrefs?.sleep !== false) {
        const sleepSamples = await appleHealth.getSleep(startDate, endDate);
        const inBedSamples = sleepSamples.filter(
          (s: any) => s.value === "INBED" || s.value === "ASLEEP",
        );
        if (inBedSamples.length > 0) {
          const totalMs = inBedSamples.reduce((sum: number, s: any) => {
            return (
              sum +
              (new Date(s.endDate).getTime() - new Date(s.startDate).getTime())
            );
          }, 0);
          const hours = Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10;
          if (hours > 0) {
            logSleep.mutate({
              date: today,
              hoursSlept: hours,
              quality: 3,
              source: "APPLE_HEALTH" as any,
            } as any);
          }
        }
      }

      // Weight
      if (syncPrefs?.weight !== false) {
        const weights = await appleHealth.getWeight(startDate, endDate);
        if (weights.length > 0) {
          const latest = weights[0];
          const kg = (latest.value as number) / 1000; // grams to kg
          if (kg > 0) {
            logWeight.mutate({
              date: new Date(latest.endDate || latest.startDate)
                .toISOString()
                .split("T")[0]!,
              weightKg: Math.round(kg * 10) / 10,
              source: "APPLE_HEALTH" as any,
            } as any);
          }
        }
      }
    } catch (err) {
      console.warn("[AppleHealth] Sync error:", err);
    }
  };

  useEffect(() => {
    if (!isConnected || Platform.OS !== "ios") return;

    // Sync on mount
    sync();

    // Sync on app foreground
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") sync();
    });

    return () => sub.remove();
  }, [isConnected]);
};
