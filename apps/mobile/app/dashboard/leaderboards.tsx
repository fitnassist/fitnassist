import { useState } from "react";
import { View, FlatList, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Trophy, Medal } from "lucide-react-native";
import { TouchableOpacity } from "react-native";
import { Text, Skeleton, TabBar } from "@/components/ui";
import { trpc } from "@/lib/trpc";
import { colors } from "@/constants/theme";

type Category =
  | "STEPS"
  | "WORKOUTS"
  | "ACTIVITY_DURATION"
  | "GOALS"
  | "STREAKS"
  | "RUNNING_DISTANCE"
  | "CYCLING_DISTANCE"
  | "FASTEST_5K";
type Period = "WEEKLY" | "MONTHLY" | "ALL_TIME";
type Scope = "FRIENDS" | "GLOBAL";

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "STEPS", label: "Steps" },
  { key: "WORKOUTS", label: "Workouts" },
  { key: "ACTIVITY_DURATION", label: "Activity" },
  { key: "GOALS", label: "Goals" },
  { key: "STREAKS", label: "Streaks" },
  { key: "RUNNING_DISTANCE", label: "Running" },
  { key: "CYCLING_DISTANCE", label: "Cycling" },
  { key: "FASTEST_5K", label: "5K" },
];

const PERIODS: { key: Period; label: string }[] = [
  { key: "WEEKLY", label: "Week" },
  { key: "MONTHLY", label: "Month" },
  { key: "ALL_TIME", label: "All Time" },
];

const MEDAL_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

const formatValue = (value: number, category: Category): string => {
  switch (category) {
    case "STEPS":
      return value.toLocaleString();
    case "ACTIVITY_DURATION": {
      if (value >= 60) return `${Math.floor(value / 60)}h ${value % 60}m`;
      return `${value}m`;
    }
    case "RUNNING_DISTANCE":
    case "CYCLING_DISTANCE":
      return `${value.toFixed(1)} km`;
    case "FASTEST_5K": {
      const mins = Math.floor(value / 60);
      const secs = value % 60;
      return `${mins}:${String(secs).padStart(2, "0")}`;
    }
    default:
      return String(value);
  }
};

const PERIOD_HIDDEN_CATEGORIES: Category[] = ["STREAKS", "FASTEST_5K"];

const LeaderboardsScreen = () => {
  const router = useRouter();
  const [category, setCategory] = useState<Category>("STEPS");
  const [period, setPeriod] = useState<Period>("WEEKLY");
  const [scope, setScope] = useState<Scope>("FRIENDS");

  const { data, isLoading, refetch } = trpc.leaderboard.getLeaderboard.useQuery(
    {
      type: category,
      period,
      scope,
    },
  );

  const entries = data?.entries ?? [];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">
          Leaderboards
        </Text>
      </View>

      <TabBar tabs={CATEGORIES} active={category} onChange={setCategory} />

      {/* Period + scope */}
      <View className="flex-row px-4 pt-2 pb-3 gap-2">
        {!PERIOD_HIDDEN_CATEGORIES.includes(category) && (
          <View className="flex-row flex-1 gap-1">
            {PERIODS.map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                className={`flex-1 items-center py-1.5 rounded ${period === key ? "bg-teal" : ""}`}
                onPress={() => setPeriod(key)}
              >
                <Text
                  className={`text-xs font-medium ${period === key ? "text-teal-foreground" : "text-muted-foreground"}`}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <TouchableOpacity
          className="px-3 py-1.5 rounded bg-card border border-border"
          onPress={() => setScope(scope === "FRIENDS" ? "GLOBAL" : "FRIENDS")}
        >
          <Text className="text-xs font-medium text-muted-foreground">
            {scope === "FRIENDS" ? "Friends" : "Global"}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="px-4 gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item: any, i) => item.userId ?? String(i)}
          renderItem={({ item, index }) => (
            <View className="flex-row items-center px-4 py-3 gap-3 border-b border-border">
              <View className="w-8 items-center">
                {index < 3 ? (
                  <Medal size={20} color={MEDAL_COLORS[index]} />
                ) : (
                  <Text className="text-sm font-medium text-muted-foreground">
                    {index + 1}
                  </Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground">
                  {item.name ?? "User"}
                </Text>
              </View>
              <Text className="text-sm font-bold text-teal">
                {formatValue(item.value ?? 0, category)}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-12 gap-2">
              <Trophy size={48} color={colors.mutedForeground} />
              <Text className="text-base text-muted-foreground">
                No leaderboard data yet
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetch}
              tintColor={colors.teal}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default LeaderboardsScreen;
