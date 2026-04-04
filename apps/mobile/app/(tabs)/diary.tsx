import { useState } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity as RNTouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  ChevronRight,
  Utensils,
  Droplets,
  Scale,
  Smile,
  Moon,
  Dumbbell,
  Footprints,
  Activity,
  Trash2,
  Users,
  Plus,
  MapPin,
  ScanBarcode,
  Camera,
} from "lucide-react-native";
import { Text, Card, CardContent, Skeleton, useAlert } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useDiaryEntries, useDailyNutrition } from "@/api/diary";
import {
  WeightLogger,
  WaterLogger,
  MoodLogger,
  SleepLogger,
  StepsLogger,
  WorkoutLogger,
  FoodLogger,
  ActivityLogger,
} from "@/components/diary";
import { trpc } from "@/lib/trpc";
import { colors } from "@/constants/theme";

const ENTRY_TYPES = [
  { type: "FOOD", icon: Utensils, color: "#f97316", label: "Food" },
  { type: "WATER", icon: Droplets, color: "#3b82f6", label: "Water" },
  { type: "WEIGHT", icon: Scale, color: "#10b981", label: "Weight" },
  { type: "MOOD", icon: Smile, color: "#f59e0b", label: "Mood" },
  { type: "SLEEP", icon: Moon, color: "#6366f1", label: "Sleep" },
  { type: "WORKOUT_LOG", icon: Dumbbell, color: "#8b5cf6", label: "Workout" },
  { type: "STEPS", icon: Footprints, color: "#22c55e", label: "Steps" },
  { type: "ACTIVITY", icon: Activity, color: "#ec4899", label: "Activity" },
] as const;

const formatDate = (d: Date) => d.toISOString().split("T")[0]!;

const LOGGER_MAP: Record<string, string> = {
  FOOD: "food",
  WATER: "water",
  WEIGHT: "weight",
  MOOD: "mood",
  SLEEP: "sleep",
  WORKOUT_LOG: "workout",
  STEPS: "steps",
  ACTIVITY: "activity",
};

const TraineeDiary = () => {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [date, setDate] = useState(() => new Date());
  const [activeLogger, setActiveLogger] = useState<string | null>(null);
  const deleteEntry = trpc.diary.deleteEntry.useMutation();
  const diaryUtils = trpc.useUtils();
  const dateStr = formatDate(date);
  const { data: entries, isLoading, refetch } = useDiaryEntries(dateStr);
  const { data: nutrition } = useDailyNutrition(dateStr);

  const isToday = formatDate(date) === formatDate(new Date());

  const changeDate = (offset: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + offset);
    setDate(d);
  };

  const entriesByType = new Map<string, any[]>();
  for (const entry of entries ?? []) {
    const list = entriesByType.get(entry.type) ?? [];
    list.push(entry);
    entriesByType.set(entry.type, list);
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="pb-8"
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={refetch}
          tintColor={colors.teal}
        />
      }
    >
      {/* GPS Tracking Button */}
      <View className="px-4 pt-2 pb-1">
        <RNTouchableOpacity
          className="flex-row items-center justify-center gap-2 rounded-xl py-3"
          style={{ backgroundColor: colors.coral }}
          onPress={() => router.push("/tracking")}
        >
          <MapPin size={18} color="#fff" />
          <Text className="text-sm font-semibold text-white">
            Start GPS Tracking
          </Text>
        </RNTouchableOpacity>
      </View>

      {/* Date Navigator */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <RNTouchableOpacity onPress={() => changeDate(-1)}>
          <ChevronLeft size={24} color={colors.foreground} />
        </RNTouchableOpacity>
        <RNTouchableOpacity onPress={() => setDate(new Date())}>
          <Text className="text-base font-medium text-foreground">
            {isToday
              ? "Today"
              : date.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
          </Text>
        </RNTouchableOpacity>
        <RNTouchableOpacity onPress={() => changeDate(1)} disabled={isToday}>
          <ChevronRight
            size={24}
            color={isToday ? colors.muted : colors.foreground}
          />
        </RNTouchableOpacity>
      </View>

      {/* Nutrition Summary */}
      {nutrition && (
        <View className="px-4 mb-4">
          <Card>
            <CardContent className="py-3 px-4">
              <View className="flex-row justify-between">
                <View className="items-center">
                  <Text className="text-lg font-bold text-foreground">
                    {nutrition.totalCalories ?? 0}
                  </Text>
                  <Text className="text-xs text-muted-foreground">kcal</Text>
                </View>
                <View className="items-center">
                  <Text className="text-lg font-bold text-foreground">
                    {nutrition.totalProtein ?? 0}g
                  </Text>
                  <Text className="text-xs text-muted-foreground">Protein</Text>
                </View>
                <View className="items-center">
                  <Text className="text-lg font-bold text-foreground">
                    {nutrition.totalCarbs ?? 0}g
                  </Text>
                  <Text className="text-xs text-muted-foreground">Carbs</Text>
                </View>
                <View className="items-center">
                  <Text className="text-lg font-bold text-foreground">
                    {nutrition.totalFat ?? 0}g
                  </Text>
                  <Text className="text-xs text-muted-foreground">Fat</Text>
                </View>
              </View>
            </CardContent>
          </Card>
        </View>
      )}

      {/* Entry Types */}
      {isLoading ? (
        <View className="px-4 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </View>
      ) : (
        <View className="px-4 gap-2">
          {ENTRY_TYPES.map(({ type, icon: Icon, color, label }) => {
            const typeEntries = entriesByType.get(type) ?? [];
            const hasEntries = typeEntries.length > 0;

            return (
              <Card key={type}>
                <CardContent className="py-3 px-4">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <View
                        className="w-8 h-8 rounded-full items-center justify-center"
                        style={{ backgroundColor: color + "20" }}
                      >
                        <Icon size={16} color={color} />
                      </View>
                      <View>
                        <Text className="text-sm font-medium text-foreground">
                          {label}
                        </Text>
                        {hasEntries ? (
                          <Text className="text-xs text-muted-foreground">
                            {typeEntries.length}{" "}
                            {typeEntries.length === 1 ? "entry" : "entries"}
                          </Text>
                        ) : (
                          <Text className="text-xs text-muted-foreground">
                            Not logged
                          </Text>
                        )}
                      </View>
                    </View>
                    <View className="flex-row items-center gap-2">
                      {type === "FOOD" && (
                        <>
                          <RNTouchableOpacity
                            className="w-8 h-8 rounded-full bg-secondary items-center justify-center"
                            onPress={() => router.push("/scan/photo")}
                          >
                            <Camera size={14} color={colors.teal} />
                          </RNTouchableOpacity>
                          <RNTouchableOpacity
                            className="w-8 h-8 rounded-full bg-secondary items-center justify-center"
                            onPress={() => router.push("/scan")}
                          >
                            <ScanBarcode size={14} color={colors.teal} />
                          </RNTouchableOpacity>
                        </>
                      )}
                      <RNTouchableOpacity
                        className="w-8 h-8 rounded-full bg-secondary items-center justify-center"
                        onPress={() =>
                          setActiveLogger(LOGGER_MAP[type] ?? null)
                        }
                      >
                        <Plus size={16} color={colors.mutedForeground} />
                      </RNTouchableOpacity>
                    </View>
                  </View>

                  {/* Show entry summaries */}
                  {typeEntries.map((entry: any) => (
                    <View
                      key={entry.id}
                      className="mt-2 pt-2 border-t border-border flex-row items-center justify-between"
                    >
                      <Text className="text-xs text-foreground flex-1">
                        {type === "WEIGHT" &&
                          `${entry.weightEntry?.weightKg ?? "-"} kg`}
                        {type === "WATER" &&
                          `${entry.waterEntry?.totalMl ?? "-"} ml`}
                        {type === "STEPS" &&
                          `${entry.stepsEntry?.totalSteps ?? "-"} steps`}
                        {type === "MOOD" && (entry.moodEntry?.level ?? "-")}
                        {type === "SLEEP" &&
                          `${entry.sleepEntry?.hoursSlept ?? "-"} hrs (quality: ${entry.sleepEntry?.quality ?? "-"}/5)`}
                        {type === "FOOD" &&
                          (entry.foodEntries?.[0]?.name ?? "Food entry")}
                        {type === "WORKOUT_LOG" &&
                          `${entry.workoutLogEntry?.durationMinutes ?? "-"} min workout`}
                        {type === "ACTIVITY" &&
                          `${entry.activityEntry?.activityType ?? "Activity"} - ${Math.round((entry.activityEntry?.durationSeconds ?? 0) / 60)} min`}
                      </Text>
                      <RNTouchableOpacity
                        onPress={() => {
                          showAlert({
                            title: "Delete Entry",
                            message: "Are you sure?",
                            actions: [
                              {
                                label: "Delete",
                                variant: "destructive",
                                onPress: () =>
                                  deleteEntry.mutate(
                                    { id: entry.id },
                                    {
                                      onSuccess: () =>
                                        diaryUtils.diary.getEntries.invalidate({
                                          date: dateStr,
                                        }),
                                    },
                                  ),
                              },
                              { label: "Cancel", variant: "outline" },
                            ],
                          });
                        }}
                      >
                        <Trash2 size={14} color={colors.destructive} />
                      </RNTouchableOpacity>
                    </View>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </View>
      )}

      {/* Logger Modals */}
      <WeightLogger
        visible={activeLogger === "weight"}
        onClose={() => setActiveLogger(null)}
        date={dateStr}
      />
      <WaterLogger
        visible={activeLogger === "water"}
        onClose={() => setActiveLogger(null)}
        date={dateStr}
      />
      <MoodLogger
        visible={activeLogger === "mood"}
        onClose={() => setActiveLogger(null)}
        date={dateStr}
      />
      <SleepLogger
        visible={activeLogger === "sleep"}
        onClose={() => setActiveLogger(null)}
        date={dateStr}
      />
      <StepsLogger
        visible={activeLogger === "steps"}
        onClose={() => setActiveLogger(null)}
        date={dateStr}
      />
      <WorkoutLogger
        visible={activeLogger === "workout"}
        onClose={() => setActiveLogger(null)}
        date={dateStr}
      />
      <FoodLogger
        visible={activeLogger === "food"}
        onClose={() => setActiveLogger(null)}
        date={dateStr}
      />
      <ActivityLogger
        visible={activeLogger === "activity"}
        onClose={() => setActiveLogger(null)}
        date={dateStr}
      />
    </ScrollView>
  );
};

const TrainerClientsTab = () => {
  const router = useRouter();
  const {
    data: activity,
    isLoading,
    refetch,
  } = trpc.diary.getRecentClientActivity.useQuery({});

  const entries = (activity ?? []) as any[];

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 py-2 pb-8"
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={refetch}
          tintColor={colors.teal}
        />
      }
    >
      <RNTouchableOpacity
        className="bg-primary rounded-lg py-3 items-center mb-4"
        onPress={() => router.push("/dashboard/clients")}
      >
        <Text className="text-sm font-semibold text-white">
          View All Clients
        </Text>
      </RNTouchableOpacity>

      <Text
        className="text-sm font-medium text-teal uppercase mb-2"
        style={{ letterSpacing: 1 }}
      >
        Recent Client Activity
      </Text>

      {isLoading ? (
        <View className="gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </View>
      ) : entries.length === 0 ? (
        <View className="items-center justify-center py-12 gap-2">
          <Users size={48} color={colors.mutedForeground} />
          <Text className="text-base text-muted-foreground">
            No recent client activity
          </Text>
        </View>
      ) : (
        <View className="gap-1">
          {entries.slice(0, 20).map((entry: any) => (
            <View
              key={entry.id}
              className="flex-row items-center gap-3 py-2 border-b border-border"
            >
              <View className="w-8 h-8 rounded-full bg-secondary items-center justify-center">
                <Text className="text-xs font-semibold text-foreground">
                  {(entry.user?.name ?? "?").charAt(0).toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground">
                  {entry.user?.name ?? "Client"}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Logged{" "}
                  {entry.type?.replace(/_/g, " ").toLowerCase() ?? "activity"}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const DiaryScreen = () => {
  const { role } = useAuth();
  const isTrainer = role === "TRAINER";

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="px-4 py-4">
        <Text
          className="text-2xl font-extralight text-foreground uppercase"
          style={{ letterSpacing: 2 }}
        >
          {isTrainer ? "Clients" : "Diary"}
        </Text>
      </View>
      {isTrainer ? <TrainerClientsTab /> : <TraineeDiary />}
    </SafeAreaView>
  );
};

export default DiaryScreen;
