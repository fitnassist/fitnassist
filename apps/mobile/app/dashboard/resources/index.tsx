import { useState } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Dumbbell, ChefHat, ClipboardList, UtensilsCrossed } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Card, CardContent, Skeleton } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { colors } from '@/constants/theme';

type Tab = 'exercises' | 'recipes' | 'workouts' | 'meals';

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'exercises', label: 'Exercises', icon: Dumbbell },
  { key: 'recipes', label: 'Recipes', icon: ChefHat },
  { key: 'workouts', label: 'Workouts', icon: ClipboardList },
  { key: 'meals', label: 'Meals', icon: UtensilsCrossed },
];

const ResourceItem = ({ item, onPress }: { item: any; onPress: () => void }) => (
  <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
    <Card className="mx-4 mb-2">
      <CardContent className="py-3 px-4">
        <Text className="text-base font-semibold text-foreground">{item.name}</Text>
        {item.description && (
          <Text className="text-sm text-muted-foreground mt-1" numberOfLines={2}>{item.description}</Text>
        )}
      </CardContent>
    </Card>
  </TouchableOpacity>
);

const ResourcesScreen = () => {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('exercises');

  const exercises = trpc.exercise.list.useQuery({});
  const recipes = trpc.recipe.list.useQuery({});
  const workouts = trpc.workoutPlan.list.useQuery({});
  const meals = trpc.mealPlan.list.useQuery({});

  const queryMap = { exercises, recipes, workouts, meals };
  const current = queryMap[tab];
  const items = Array.isArray(current.data) ? current.data : (current.data as any)?.items ?? [];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">Resources</Text>
      </View>

      {/* Tabs */}
      <View className="flex-row px-4 pt-4 pb-2 gap-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <TouchableOpacity
            key={key}
            className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-lg ${
              tab === key ? 'bg-primary' : 'bg-card border border-border'
            }`}
            onPress={() => setTab(key)}
          >
            <Icon size={14} color={tab === key ? '#fff' : colors.mutedForeground} />
            <Text className={`text-xs font-medium ${tab === key ? 'text-white' : 'text-muted-foreground'}`}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {current.isLoading ? (
        <View className="px-4 gap-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }) => (
            <ResourceItem item={item} onPress={() => {/* detail screen TBD */}} />
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-base text-muted-foreground">No {tab} yet</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={false} onRefresh={() => current.refetch()} tintColor={colors.teal} />}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
};

export default ResourcesScreen;
