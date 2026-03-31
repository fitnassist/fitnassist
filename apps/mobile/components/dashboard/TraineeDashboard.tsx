import { View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Utensils,
  Droplets,
  Scale,
  Smile,
  Moon,
  Dumbbell,
  Footprints,
  Target,
  ClipboardList,
  Search,
  Users,
  MessageCircle,
  CheckCircle,
} from 'lucide-react-native';
import { Text, Card, CardContent, Skeleton } from '@/components/ui';
import { useMyTraineeProfile, useNutritionTargets } from '@/api/trainee';
import { useDiaryEntries, useDailyNutrition } from '@/api/diary';
import { useUpcomingBookings } from '@/api/booking';
import { useUnreadMessageCount } from '@/api/message';
import { QuickAction } from './QuickAction';
import { colors } from '@/constants/theme';

const today = new Date().toISOString().split('T')[0];

const TRACKER_ITEMS = [
  { type: 'FOOD', icon: Utensils, color: '#f97316', label: 'Food' },
  { type: 'WATER', icon: Droplets, color: '#3b82f6', label: 'Water' },
  { type: 'WEIGHT', icon: Scale, color: '#10b981', label: 'Weight' },
  { type: 'MOOD', icon: Smile, color: '#f59e0b', label: 'Mood' },
  { type: 'SLEEP', icon: Moon, color: '#6366f1', label: 'Sleep' },
  { type: 'WORKOUT_LOG', icon: Dumbbell, color: '#8b5cf6', label: 'Workout' },
  { type: 'STEPS', icon: Footprints, color: '#22c55e', label: 'Steps' },
] as const;

export const TraineeDashboard = () => {
  const router = useRouter();
  const { data: profile, refetch: refetchProfile } = useMyTraineeProfile();
  const { data: entries, isLoading: entriesLoading, refetch: refetchEntries } = useDiaryEntries(today);
  const { data: nutrition, isLoading: nutritionLoading, refetch: refetchNutrition } = useDailyNutrition(today);
  const { data: targets } = useNutritionTargets();
  const { data: bookings, refetch: refetchBookings } = useUpcomingBookings();
  const { data: unreadCount } = useUnreadMessageCount();

  const onRefresh = async () => {
    await Promise.all([refetchProfile(), refetchEntries(), refetchNutrition(), refetchBookings()]);
  };

  const loggedTypes = new Set(
    (entries ?? []).map((e: { type: string }) => e.type),
  );

  const caloriesConsumed = nutrition?.totalCalories ?? 0;
  const calorieTarget = targets?.effective?.calories ?? 2000;
  const calorieProgress = Math.min(caloriesConsumed / calorieTarget, 1);

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="pb-8"
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.teal} />
      }
    >
      {/* Today Summary */}
      <View className="px-4 mb-6">
        <TouchableOpacity onPress={() => router.push('/(tabs)/diary')} activeOpacity={0.8}>
        <Card>
          <CardContent className="py-4 px-4 gap-4">
            <Text className="text-sm font-medium text-primary uppercase" style={{ letterSpacing: 1 }}>
              Today
            </Text>

            {/* Calorie Summary */}
            {nutritionLoading ? (
              <Skeleton className="h-16 rounded-lg" />
            ) : (
              <View className="gap-2">
                <View className="flex-row items-baseline justify-between">
                  <Text className="text-3xl font-bold text-foreground">
                    {caloriesConsumed}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    / {calorieTarget} kcal
                  </Text>
                </View>
                <View className="h-2 bg-secondary rounded-full overflow-hidden">
                  <View
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${calorieProgress * 100}%` }}
                  />
                </View>
                <View className="flex-row justify-between">
                  <View className="items-center">
                    <Text className="text-xs text-muted-foreground">Protein</Text>
                    <Text className="text-sm font-semibold text-foreground">
                      {nutrition?.totalProtein ?? 0}g
                    </Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-xs text-muted-foreground">Carbs</Text>
                    <Text className="text-sm font-semibold text-foreground">
                      {nutrition?.totalCarbs ?? 0}g
                    </Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-xs text-muted-foreground">Fat</Text>
                    <Text className="text-sm font-semibold text-foreground">
                      {nutrition?.totalFat ?? 0}g
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Daily Tracker */}
            {entriesLoading ? (
              <Skeleton className="h-10 rounded-lg" />
            ) : (
              <View className="flex-row justify-between">
                {TRACKER_ITEMS.map(({ type, icon: Icon, color, label }) => {
                  const logged = loggedTypes.has(type);
                  return (
                    <View key={type} className="items-center gap-1">
                      <View className="relative">
                        <View
                          className="w-9 h-9 rounded-full items-center justify-center"
                          style={{
                            backgroundColor: color + '20',
                            borderWidth: 1,
                            borderColor: logged ? color : color + '40',
                            opacity: logged ? 1 : 0.4,
                          }}
                        >
                          <Icon size={16} color={color} />
                        </View>
                        {logged && (
                          <View
                            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full items-center justify-center"
                            style={{ backgroundColor: colors.primary }}
                          >
                            <CheckCircle size={10} color="#fff" />
                          </View>
                        )}
                      </View>
                      <Text className="text-[10px] text-muted-foreground">{label}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </CardContent>
        </Card>
        </TouchableOpacity>
      </View>

      {/* Upcoming Bookings */}
      {bookings && bookings.length > 0 && (
        <View className="px-4 mb-6">
          <Card>
            <CardContent className="py-4 px-4 gap-2">
              <Text className="text-sm font-medium text-primary uppercase" style={{ letterSpacing: 1 }}>
                Upcoming Bookings
              </Text>
              {bookings.slice(0, 3).map((booking: { id: string; startTime: string; trainer?: { displayName?: string } }) => (
                <View key={booking.id} className="flex-row items-center justify-between py-2 border-b border-border">
                  <View>
                    <Text className="text-sm font-medium text-foreground">
                      {booking.trainer?.displayName ?? 'Session'}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      {new Date(booking.startTime).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              ))}
            </CardContent>
          </Card>
        </View>
      )}

      {/* Quick Actions */}
      <View className="px-4 gap-2">
        <Text className="text-sm font-medium text-teal uppercase mb-1" style={{ letterSpacing: 1 }}>
          Quick Actions
        </Text>
        <View className="flex-row gap-2">
          <QuickAction
            label="Diary"
            description="Log food, weight & more"
            icon={Utensils}
            onPress={() => router.push('/(tabs)/diary')}
          />
          <QuickAction
            label="Goals"
            description="Track your progress"
            icon={Target}
            onPress={() => router.push('/dashboard/goals')}
          />
        </View>
        <View className="flex-row gap-2">
          <QuickAction
            label="My Plans"
            description="View assigned plans"
            icon={ClipboardList}
            onPress={() => router.push('/dashboard/my-plans')}
          />
          <QuickAction
            label="Find Trainers"
            description="Browse trainers near you"
            icon={Search}
            onPress={() => router.push('/trainers')}
          />
        </View>
        <View className="flex-row gap-2">
          <QuickAction
            label="My Contacts"
            description="Your trainer connections"
            icon={Users}
            onPress={() => router.push('/dashboard/contacts')}
          />
          <QuickAction
            label="Messages"
            description="Chat with your trainers"
            icon={MessageCircle}
            onPress={() => router.push('/(tabs)/messages')}
            badge={unreadCount?.count ?? 0}
          />
        </View>
      </View>
    </ScrollView>
  );
};
