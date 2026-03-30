import { useState } from 'react';
import { View, ScrollView, RefreshControl, TouchableOpacity as RNTouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  Users,
  Plus,
} from 'lucide-react-native';
import { Text, Card, CardContent, Skeleton } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useDiaryEntries, useDailyNutrition } from '@/api/diary';
import { useClients } from '@/api/client';
import {
  WeightLogger,
  WaterLogger,
  MoodLogger,
  SleepLogger,
  StepsLogger,
  WorkoutLogger,
  FoodLogger,
} from '@/components/diary';
import { colors } from '@/constants/theme';

const ENTRY_TYPES = [
  { type: 'FOOD', icon: Utensils, color: '#f97316', label: 'Food' },
  { type: 'WATER', icon: Droplets, color: '#3b82f6', label: 'Water' },
  { type: 'WEIGHT', icon: Scale, color: '#10b981', label: 'Weight' },
  { type: 'MOOD', icon: Smile, color: '#f59e0b', label: 'Mood' },
  { type: 'SLEEP', icon: Moon, color: '#6366f1', label: 'Sleep' },
  { type: 'WORKOUT_LOG', icon: Dumbbell, color: '#8b5cf6', label: 'Workout' },
  { type: 'STEPS', icon: Footprints, color: '#22c55e', label: 'Steps' },
] as const;

const formatDate = (d: Date) => d.toISOString().split('T')[0]!;

const LOGGER_MAP: Record<string, string> = {
  FOOD: 'food',
  WATER: 'water',
  WEIGHT: 'weight',
  MOOD: 'mood',
  SLEEP: 'sleep',
  WORKOUT_LOG: 'workout',
  STEPS: 'steps',
};

const TraineeDiary = () => {
  const [date, setDate] = useState(() => new Date());
  const [activeLogger, setActiveLogger] = useState<string | null>(null);
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
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.teal} />}
    >
      {/* Date Navigator */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <RNTouchableOpacity onPress={() => changeDate(-1)}>
          <ChevronLeft size={24} color={colors.foreground} />
        </RNTouchableOpacity>
        <RNTouchableOpacity onPress={() => setDate(new Date())}>
          <Text className="text-base font-medium text-foreground">
            {isToday ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>
        </RNTouchableOpacity>
        <RNTouchableOpacity onPress={() => changeDate(1)} disabled={isToday}>
          <ChevronRight size={24} color={isToday ? colors.muted : colors.foreground} />
        </RNTouchableOpacity>
      </View>

      {/* Nutrition Summary */}
      {nutrition && (
        <View className="px-4 mb-4">
          <Card>
            <CardContent className="py-3 px-4">
              <View className="flex-row justify-between">
                <View className="items-center">
                  <Text className="text-lg font-bold text-foreground">{nutrition.totalCalories ?? 0}</Text>
                  <Text className="text-xs text-muted-foreground">kcal</Text>
                </View>
                <View className="items-center">
                  <Text className="text-lg font-bold text-foreground">{nutrition.totalProtein ?? 0}g</Text>
                  <Text className="text-xs text-muted-foreground">Protein</Text>
                </View>
                <View className="items-center">
                  <Text className="text-lg font-bold text-foreground">{nutrition.totalCarbs ?? 0}g</Text>
                  <Text className="text-xs text-muted-foreground">Carbs</Text>
                </View>
                <View className="items-center">
                  <Text className="text-lg font-bold text-foreground">{nutrition.totalFat ?? 0}g</Text>
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
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
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
                      <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: color + '20' }}>
                        <Icon size={16} color={color} />
                      </View>
                      <View>
                        <Text className="text-sm font-medium text-foreground">{label}</Text>
                        {hasEntries ? (
                          <Text className="text-xs text-muted-foreground">
                            {typeEntries.length} {typeEntries.length === 1 ? 'entry' : 'entries'}
                          </Text>
                        ) : (
                          <Text className="text-xs text-muted-foreground">Not logged</Text>
                        )}
                      </View>
                    </View>
                    <RNTouchableOpacity
                      className="w-8 h-8 rounded-full bg-secondary items-center justify-center"
                      onPress={() => setActiveLogger(LOGGER_MAP[type] ?? null)}
                    >
                      <Plus size={16} color={colors.mutedForeground} />
                    </RNTouchableOpacity>
                  </View>

                  {/* Show entry summaries */}
                  {typeEntries.map((entry: any) => (
                    <View key={entry.id} className="mt-2 pt-2 border-t border-border">
                      <Text className="text-xs text-foreground">
                        {type === 'WEIGHT' && `${entry.valueNumeric ?? entry.weight ?? '-'} kg`}
                        {type === 'WATER' && `${entry.valueNumeric ?? entry.amount ?? '-'} ml`}
                        {type === 'STEPS' && `${entry.valueNumeric ?? entry.steps ?? '-'} steps`}
                        {type === 'MOOD' && (entry.valueText ?? entry.mood ?? '-')}
                        {type === 'SLEEP' && `${entry.valueNumeric ?? '-'} hrs`}
                        {type === 'FOOD' && (entry.valueText ?? entry.foodName ?? 'Food entry')}
                        {type === 'WORKOUT_LOG' && (entry.valueText ?? 'Workout logged')}
                      </Text>
                    </View>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </View>
      )}

      {/* Logger Modals */}
      <WeightLogger visible={activeLogger === 'weight'} onClose={() => setActiveLogger(null)} date={dateStr} />
      <WaterLogger visible={activeLogger === 'water'} onClose={() => setActiveLogger(null)} date={dateStr} />
      <MoodLogger visible={activeLogger === 'mood'} onClose={() => setActiveLogger(null)} date={dateStr} />
      <SleepLogger visible={activeLogger === 'sleep'} onClose={() => setActiveLogger(null)} date={dateStr} />
      <StepsLogger visible={activeLogger === 'steps'} onClose={() => setActiveLogger(null)} date={dateStr} />
      <WorkoutLogger visible={activeLogger === 'workout'} onClose={() => setActiveLogger(null)} date={dateStr} />
      <FoodLogger visible={activeLogger === 'food'} onClose={() => setActiveLogger(null)} date={dateStr} />
    </ScrollView>
  );
};

const TrainerClientsTab = () => {
  const router = useRouter();
  const { data: clients, isLoading, refetch } = useClients();

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 py-2 pb-8"
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.teal} />}
    >
      {isLoading ? (
        <View className="gap-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </View>
      ) : ((clients as any)?.clients ?? []).length === 0 ? (
        <View className="items-center justify-center py-12 gap-2">
          <Users size={48} color={colors.mutedForeground} />
          <Text className="text-base text-muted-foreground">No clients yet</Text>
        </View>
      ) : (
        <View className="gap-2">
          {((clients as any)?.clients ?? []).map((client: any) => {
            const name = client.connection?.sender?.name ?? client.connection?.name ?? 'Unknown';
            return (
              <RNTouchableOpacity
                key={client.id}
                className="bg-card border border-border rounded-lg p-4 flex-row items-center gap-3"
                onPress={() => router.push(`/dashboard/clients/${client.id}`)}
              >
                <View className="w-10 h-10 rounded-full bg-secondary items-center justify-center">
                  <Text className="text-sm font-semibold text-foreground">{name.charAt(0).toUpperCase()}</Text>
                </View>
                <Text className="text-base font-medium text-foreground">{name}</Text>
              </RNTouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const DiaryScreen = () => {
  const { role } = useAuth();
  const isTrainer = role === 'TRAINER';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-4 py-4">
        <Text className="text-2xl font-extralight text-foreground uppercase" style={{ letterSpacing: 2 }}>
          {isTrainer ? 'Clients' : 'Diary'}
        </Text>
      </View>
      {isTrainer ? <TrainerClientsTab /> : <TraineeDiary />}
    </SafeAreaView>
  );
};

export default DiaryScreen;
