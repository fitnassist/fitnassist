import { View, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Dumbbell, UtensilsCrossed } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Card, CardContent, Skeleton } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { colors } from '@/constants/theme';

const MyPlansScreen = () => {
  const router = useRouter();
  const { data: assignments, isLoading, refetch } = trpc.clientRoster.myAssignments.useQuery();

  const workoutPlans = (assignments as any)?.workoutPlanAssignments ?? [];
  const mealPlans = (assignments as any)?.mealPlanAssignments ?? [];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">My Plans</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4 gap-4 pb-8"
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.teal} />}
      >
        {isLoading ? (
          <View className="gap-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </View>
        ) : (
          <>
            <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>
              Workout Plans
            </Text>
            {workoutPlans.length === 0 ? (
              <Text className="text-sm text-muted-foreground">No workout plans assigned</Text>
            ) : (
              workoutPlans.map((plan: any) => (
                <Card key={plan.id}>
                  <CardContent className="py-4 px-4 gap-2">
                    <View className="flex-row items-center gap-2">
                      <Dumbbell size={16} color={colors.teal} />
                      <Text className="text-base font-semibold text-foreground">{plan.name}</Text>
                    </View>
                    {plan.description && (
                      <Text className="text-sm text-muted-foreground">{plan.description}</Text>
                    )}
                    {plan.exercises && plan.exercises.length > 0 && (
                      <Text className="text-xs text-muted-foreground">
                        {plan.exercises.length} exercises
                      </Text>
                    )}
                  </CardContent>
                </Card>
              ))
            )}

            <Text className="text-sm font-medium text-teal uppercase mt-2" style={{ letterSpacing: 1 }}>
              Meal Plans
            </Text>
            {mealPlans.length === 0 ? (
              <Text className="text-sm text-muted-foreground">No meal plans assigned</Text>
            ) : (
              mealPlans.map((plan: any) => (
                <Card key={plan.id}>
                  <CardContent className="py-4 px-4 gap-2">
                    <View className="flex-row items-center gap-2">
                      <UtensilsCrossed size={16} color={colors.teal} />
                      <Text className="text-base font-semibold text-foreground">{plan.name}</Text>
                    </View>
                    {plan.description && (
                      <Text className="text-sm text-muted-foreground">{plan.description}</Text>
                    )}
                    {plan.recipes && plan.recipes.length > 0 && (
                      <Text className="text-xs text-muted-foreground">
                        {plan.recipes.length} recipes
                      </Text>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default MyPlansScreen;
