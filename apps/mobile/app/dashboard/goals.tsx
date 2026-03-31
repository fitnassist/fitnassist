import { useState } from 'react';
import { View, FlatList, RefreshControl, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Target, CheckCircle, Trophy, Plus, X } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Card, CardContent, Skeleton, Badge, Button, Input, TabBar, DatePicker, PillSelect, useAlert } from '@/components/ui';
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
  const { showAlert } = useAlert();
  const router = useRouter();
  const [filter, setFilter] = useState<GoalFilter>('ACTIVE');
  const [showCreate, setShowCreate] = useState(false);
  const [newGoal, setNewGoal] = useState<{ name: string; description: string; type: 'TARGET' | 'HABIT'; targetValue: string; deadline: string; _showPicker?: boolean }>({ name: '', description: '', type: 'TARGET', targetValue: '', deadline: '' });
  const { data: goals, isLoading, refetch } = trpc.goal.list.useQuery({ status: filter });
  const completeGoal = trpc.goal.complete.useMutation();
  const abandonGoal = trpc.goal.abandon.useMutation();
  const createGoal = trpc.goal.create.useMutation();
  const utils = trpc.useUtils();

  const invalidate = () => utils.goal.list.invalidate();

  const handleComplete = (id: string) => {
    completeGoal.mutate({ id }, { onSuccess: invalidate });
  };

  const handleAbandon = (id: string) => {
    showAlert({
      title: 'Abandon Goal',
      message: 'Are you sure?',
      actions: [
        { label: 'Abandon', variant: 'destructive', onPress: () => abandonGoal.mutate({ id }, { onSuccess: invalidate }) },
        { label: 'Cancel', variant: 'outline' },
      ],
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-base font-semibold text-foreground">Goals</Text>
        </View>
        <TouchableOpacity onPress={() => setShowCreate(true)} className="flex-row items-center gap-1">
          <Plus size={18} color={colors.teal} />
          <Text className="text-sm font-medium text-teal">New</Text>
        </TouchableOpacity>
      </View>

      {/* Create Goal Modal */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCreate(false)}>
        <View className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
            <Text className="text-base font-semibold text-foreground">Create Goal</Text>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <X size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-4 pb-8" keyboardShouldPersistTaps="handled">
              <Input label="Goal Name" value={newGoal.name} onChangeText={(v) => setNewGoal((g) => ({ ...g, name: v }))} placeholder="e.g. Lose 5kg" />
              <Input label="Description (optional)" value={newGoal.description} onChangeText={(v) => setNewGoal((g) => ({ ...g, description: v }))} multiline />
              <Text className="text-sm font-medium text-foreground">Type</Text>
              <PillSelect options={['TARGET', 'HABIT']} value={newGoal.type} onChange={(v: string) => setNewGoal((g) => ({ ...g, type: v }))} />
              {newGoal.type === 'TARGET' && (
                <Input label="Target Value" value={newGoal.targetValue} onChangeText={(v) => setNewGoal((g) => ({ ...g, targetValue: v }))} keyboardType="decimal-pad" placeholder="e.g. 70" />
              )}
              <DatePicker
                value={newGoal.deadline}
                onChange={(v) => setNewGoal((g) => ({ ...g, deadline: v }))}
                minDate={new Date()}
                placeholder="Select deadline (optional)"
              />
              <Button
                onPress={() => {
                  if (!newGoal.name.trim()) { showAlert({ title: 'Error', message: 'Name is required' }); return; }
                  createGoal.mutate(
                    {
                      name: newGoal.name,
                      description: newGoal.description || undefined,
                      type: newGoal.type,
                      targetValue: newGoal.targetValue ? parseFloat(newGoal.targetValue) : undefined,
                      deadline: newGoal.deadline || undefined,
                    } as any,
                    {
                      onSuccess: () => {
                        invalidate();
                        setShowCreate(false);
                        setNewGoal({ name: '', description: '', type: 'TARGET', targetValue: '', deadline: '' });
                      },
                      onError: () => showAlert({ title: 'Error', message: 'Failed to create goal' }),
                    },
                  );
                }}
                loading={createGoal.isPending}
              >
                Create Goal
              </Button>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <TabBar tabs={FILTERS} active={filter} onChange={setFilter} />

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
