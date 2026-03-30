import { useState } from 'react';
import { View, FlatList, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Target, CheckCircle, Trophy } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Card, CardContent, Skeleton, Badge, Button } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { colors } from '@/constants/theme';

type GoalFilter = 'ACTIVE' | 'COMPLETED' | 'ABANDONED';

const FILTERS: { key: GoalFilter; label: string }[] = [
  { key: 'ACTIVE', label: 'Active' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'ABANDONED', label: 'Abandoned' },
];

const GoalCard = ({ goal, onComplete, onAbandon }: { goal: any; onComplete: () => void; onAbandon: () => void }) => {
  const isActive = goal.status === 'ACTIVE';
  const progress = goal.targetValue ? Math.min((goal.currentValue ?? 0) / goal.targetValue, 1) : 0;

  return (
    <Card className="mx-4 mb-2">
      <CardContent className="py-4 px-4 gap-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2 flex-1">
            <Target size={16} color={colors.teal} />
            <Text className="text-base font-semibold text-foreground flex-1" numberOfLines={1}>{goal.name}</Text>
          </View>
          <Badge variant={goal.status === 'COMPLETED' ? 'default' : 'secondary'}>{goal.status}</Badge>
        </View>

        {goal.description && (
          <Text className="text-sm text-muted-foreground">{goal.description}</Text>
        )}

        {goal.type === 'TARGET' && goal.targetValue && (
          <View className="gap-1">
            <View className="flex-row justify-between">
              <Text className="text-xs text-muted-foreground">Progress</Text>
              <Text className="text-xs text-foreground">{goal.currentValue ?? 0} / {goal.targetValue}</Text>
            </View>
            <View className="h-2 bg-secondary rounded-full overflow-hidden">
              <View className="h-full bg-teal rounded-full" style={{ width: `${progress * 100}%` }} />
            </View>
          </View>
        )}

        {goal.deadline && (
          <Text className="text-xs text-muted-foreground">
            Deadline: {new Date(goal.deadline).toLocaleDateString()}
          </Text>
        )}

        {isActive && (
          <View className="flex-row gap-2 mt-1">
            <Button size="sm" onPress={onComplete} className="flex-1">
              <View className="flex-row items-center gap-1">
                <Trophy size={14} color="#fff" />
                <Text className="text-sm font-semibold text-white">Complete</Text>
              </View>
            </Button>
            <Button size="sm" variant="outline" onPress={onAbandon} className="flex-1">Abandon</Button>
          </View>
        )}
      </CardContent>
    </Card>
  );
};

const GoalsScreen = () => {
  const router = useRouter();
  const [filter, setFilter] = useState<GoalFilter>('ACTIVE');
  const { data: goals, isLoading, refetch } = trpc.goal.list.useQuery({ status: filter });
  const completeGoal = trpc.goal.complete.useMutation();
  const abandonGoal = trpc.goal.abandon.useMutation();
  const utils = trpc.useUtils();

  const invalidate = () => utils.goal.list.invalidate();

  const handleComplete = (id: string) => {
    completeGoal.mutate({ id }, { onSuccess: invalidate });
  };

  const handleAbandon = (id: string) => {
    Alert.alert('Abandon Goal', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Abandon', style: 'destructive', onPress: () => abandonGoal.mutate({ id }, { onSuccess: invalidate }) },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">Goals</Text>
      </View>

      <View className="flex-row px-4 py-3 gap-2">
        {FILTERS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            className={`flex-1 items-center py-2 rounded-lg ${filter === key ? 'bg-primary' : 'bg-card border border-border'}`}
            onPress={() => setFilter(key)}
          >
            <Text className={`text-sm font-medium ${filter === key ? 'text-white' : 'text-muted-foreground'}`}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View className="px-4 gap-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </View>
      ) : (
        <FlatList
          data={goals ?? []}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }) => (
            <GoalCard goal={item} onComplete={() => handleComplete(item.id)} onAbandon={() => handleAbandon(item.id)} />
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-base text-muted-foreground">No {filter.toLowerCase()} goals</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.teal} />}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
};

export default GoalsScreen;
