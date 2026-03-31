import { useState } from 'react';
import { View, ScrollView, RefreshControl, Image, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, MessageCircle, UserMinus, Dumbbell, UtensilsCrossed,
  Trash2, Plus, Target, Send, Calendar as CalendarIcon, Scale, Droplets,
  Smile, Moon, Footprints, Activity, Utensils, Camera, Ruler,
} from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Text, Button, Input, Card, CardContent, Skeleton, Badge, TabBar, ListPicker, PillSelect, type ListPickerItem, DatePicker, useAlert } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { formatDistanceToNow, formatMessageTime } from '@/lib/dates';
import { colors } from '@/constants/theme';

type Tab = 'overview' | 'plans' | 'progress' | 'notes';

const STATUSES = ['ACTIVE', 'INACTIVE', 'ON_HOLD', 'ONBOARDING'] as const;

const ENTRY_ICONS: Record<string, { icon: any; color: string }> = {
  WEIGHT: { icon: Scale, color: '#10b981' },
  WATER: { icon: Droplets, color: '#06b6d4' },
  MEASUREMENT: { icon: Ruler, color: '#f97316' },
  MOOD: { icon: Smile, color: '#f59e0b' },
  SLEEP: { icon: Moon, color: '#6366f1' },
  FOOD: { icon: Utensils, color: '#ef4444' },
  WORKOUT_LOG: { icon: Dumbbell, color: '#8b5cf6' },
  STEPS: { icon: Footprints, color: '#14b8a6' },
  ACTIVITY: { icon: Activity, color: '#3b82f6' },
  PROGRESS_PHOTO: { icon: Camera, color: '#ec4899' },
};

// ===== PLANS TAB =====
const PlansTab = ({ clientRosterId, isDisconnected }: { clientRosterId: string; isDisconnected: boolean }) => {
  const { showAlert } = useAlert();
  const { data: client } = trpc.clientRoster.get.useQuery({ id: clientRosterId });
  const { data: workoutPlans } = trpc.workoutPlan.list.useQuery({ limit: 50 });
  const { data: mealPlans } = trpc.mealPlan.list.useQuery({ limit: 50 });
  const assignWorkout = trpc.clientRoster.assignWorkoutPlan.useMutation();
  const unassignWorkout = trpc.clientRoster.unassignWorkoutPlan.useMutation();
  const assignMeal = trpc.clientRoster.assignMealPlan.useMutation();
  const unassignMeal = trpc.clientRoster.unassignMealPlan.useMutation();
  const utils = trpc.useUtils();
  const invalidate = () => utils.clientRoster.get.invalidate({ id: clientRosterId });

  const assignedWorkouts = (client as any)?.workoutPlanAssignments ?? [];
  const assignedMeals = (client as any)?.mealPlanAssignments ?? [];
  const assignedWorkoutIds = new Set(assignedWorkouts.map((a: any) => a.workoutPlanId));
  const assignedMealIds = new Set(assignedMeals.map((a: any) => a.mealPlanId));
  const allWorkouts = (workoutPlans as any)?.plans ?? [];
  const allMeals = (mealPlans as any)?.plans ?? [];
  const unassignedWorkouts = allWorkouts.filter((p: any) => !assignedWorkoutIds.has(p.id));
  const unassignedMeals = allMeals.filter((p: any) => !assignedMealIds.has(p.id));

  const [showWorkoutPicker, setShowWorkoutPicker] = useState(false);
  const [showMealPicker, setShowMealPicker] = useState(false);

  const workoutPickerItems: ListPickerItem[] = unassignedWorkouts.map((p: any) => ({
    id: p.id,
    label: p.name,
    description: p._count?.exercises ? `${p._count.exercises} exercises` : undefined,
  }));

  const mealPickerItems: ListPickerItem[] = unassignedMeals.map((p: any) => ({
    id: p.id,
    label: p.name,
    description: p._count?.recipes ? `${p._count.recipes} recipes` : undefined,
  }));

  return (
    <View className="gap-4">
      <Card>
        <CardContent className="py-4 px-4 gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Workout Plans</Text>
            {!isDisconnected && (
              <TouchableOpacity onPress={() => setShowWorkoutPicker(true)}>
                <Plus size={18} color={colors.teal} />
              </TouchableOpacity>
            )}
          </View>
          {assignedWorkouts.length === 0 && <Text className="text-xs text-muted-foreground">No workout plans assigned.</Text>}
          {assignedWorkouts.map((a: any) => (
            <View key={a.id} className="flex-row items-center justify-between py-2 border-b border-border">
              <View className="flex-row items-center gap-2 flex-1">
                <Dumbbell size={14} color={colors.teal} />
                <Text className="text-sm text-foreground">{a.workoutPlan?.name ?? 'Plan'}</Text>
              </View>
              {!isDisconnected && (
                <TouchableOpacity onPress={() => {
                  showAlert({ title: 'Remove Plan', message: `Unassign ${a.workoutPlan?.name}?`, actions: [
                    { label: 'Remove', variant: 'destructive', onPress: () => unassignWorkout.mutate({ clientRosterId, workoutPlanId: a.workoutPlanId } as any, { onSuccess: invalidate }) },
                    { label: 'Cancel', variant: 'outline' },
                  ]});
                }}>
                  <Trash2 size={14} color={colors.destructive} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4 px-4 gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Meal Plans</Text>
            {!isDisconnected && (
              <TouchableOpacity onPress={() => setShowMealPicker(true)}>
                <Plus size={18} color={colors.teal} />
              </TouchableOpacity>
            )}
          </View>
          {assignedMeals.length === 0 && <Text className="text-xs text-muted-foreground">No meal plans assigned.</Text>}
          {assignedMeals.map((a: any) => (
            <View key={a.id} className="flex-row items-center justify-between py-2 border-b border-border">
              <View className="flex-row items-center gap-2 flex-1">
                <UtensilsCrossed size={14} color={colors.teal} />
                <Text className="text-sm text-foreground">{a.mealPlan?.name ?? 'Plan'}</Text>
              </View>
              {!isDisconnected && (
                <TouchableOpacity onPress={() => {
                  showAlert({ title: 'Remove Plan', message: `Unassign ${a.mealPlan?.name}?`, actions: [
                    { label: 'Remove', variant: 'destructive', onPress: () => unassignMeal.mutate({ clientRosterId, mealPlanId: a.mealPlanId } as any, { onSuccess: invalidate }) },
                    { label: 'Cancel', variant: 'outline' },
                  ]});
                }}>
                  <Trash2 size={14} color={colors.destructive} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </CardContent>
      </Card>

      <ListPicker
        visible={showWorkoutPicker}
        onClose={() => setShowWorkoutPicker(false)}
        title="Assign Workout Plan"
        items={workoutPickerItems}
        selectedIds={[...assignedWorkoutIds] as string[]}
        onSelect={(item) => {
          assignWorkout.mutate({ clientRosterId, workoutPlanId: item.id } as any, { onSuccess: invalidate });
        }}
      />

      <ListPicker
        visible={showMealPicker}
        onClose={() => setShowMealPicker(false)}
        title="Assign Meal Plan"
        items={mealPickerItems}
        selectedIds={[...assignedMealIds] as string[]}
        onSelect={(item) => {
          assignMeal.mutate({ clientRosterId, mealPlanId: item.id } as any, { onSuccess: invalidate });
        }}
      />
    </View>
  );
};

// ===== PROGRESS TAB =====
const ProgressTab = ({ clientRosterId, clientUserId }: { clientRosterId: string; clientUserId: string }) => {
  const { showAlert } = useAlert();
  const today = new Date().toISOString().split('T')[0]!;
  const [selectedDate, setSelectedDate] = useState(today);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalDesc, setGoalDesc] = useState('');
  const [goalType, setGoalType] = useState<'TARGET' | 'HABIT'>('TARGET');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [commentText, setCommentText] = useState('');

  const { data: goals, refetch: refetchGoals } = trpc.goal.list.useQuery({ status: 'ACTIVE', clientRosterId } as any);
  const { data: entries, refetch: refetchEntries } = trpc.diary.getEntries.useQuery({ date: selectedDate, userId: clientUserId } as any);
  const { data: comments, refetch: refetchComments } = trpc.diary.getComments.useQuery({ date: selectedDate, userId: clientUserId } as any);

  const createGoal = trpc.goal.create.useMutation();
  const addComment = trpc.diary.addComment.useMutation();
  const deleteComment = trpc.diary.deleteComment.useMutation();

  const goalsList = (goals ?? []) as any[];
  const entryList = (entries ?? []) as any[];
  const commentList = (comments ?? []) as any[];

  const handleCreateGoal = () => {
    if (!goalName.trim()) { showAlert({ title: 'Error', message: 'Name is required' }); return; }
    createGoal.mutate({
      name: goalName, description: goalDesc || undefined, type: goalType,
      targetValue: goalType === 'TARGET' && goalTarget ? parseFloat(goalTarget) : undefined,
      deadline: goalDeadline || undefined, clientRosterId,
    } as any, {
      onSuccess: () => {
        refetchGoals(); setShowCreateGoal(false);
        setGoalName(''); setGoalDesc(''); setGoalTarget(''); setGoalDeadline('');
      },
      onError: () => showAlert({ title: 'Error', message: 'Failed to create goal' }),
    });
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addComment.mutate({ date: selectedDate, userId: clientUserId, content: commentText.trim() } as any, {
      onSuccess: () => { refetchComments(); setCommentText(''); },
      onError: () => showAlert({ title: 'Error', message: 'Failed to add comment' }),
    });
  };

  return (
    <View className="gap-4">
      {/* Goals */}
      <Card>
        <CardContent className="py-4 px-4 gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Goals</Text>
            <TouchableOpacity onPress={() => setShowCreateGoal(!showCreateGoal)}>
              <Text className="text-sm text-teal">{showCreateGoal ? 'Cancel' : '+ Create'}</Text>
            </TouchableOpacity>
          </View>

          {showCreateGoal && (
            <View className="bg-secondary/50 rounded-lg p-3 gap-3 border border-border">
              <PillSelect options={['TARGET', 'HABIT']} value={goalType} onChange={setGoalType} />
              <Input label="Goal Name" value={goalName} onChangeText={setGoalName} placeholder="e.g. Lose 5kg" />
              <Input label="Description (optional)" value={goalDesc} onChangeText={setGoalDesc} placeholder="Details..." />
              {goalType === 'TARGET' && (
                <Input label="Target Value" value={goalTarget} onChangeText={setGoalTarget} keyboardType="decimal-pad" placeholder="e.g. 70" />
              )}
              <DatePicker
                value={goalDeadline}
                onChange={setGoalDeadline}
                minDate={new Date()}
                placeholder="Set deadline (optional)"
              />
              <Button size="sm" onPress={handleCreateGoal} loading={createGoal.isPending}>Create Goal</Button>
            </View>
          )}

          {goalsList.length === 0 && !showCreateGoal && <Text className="text-xs text-muted-foreground">No active goals.</Text>}
          {goalsList.map((goal: any) => {
            const progress = goal.targetValue ? Math.min((goal.currentValue ?? 0) / goal.targetValue, 1) : 0;
            return (
              <View key={goal.id} className="gap-1 py-2 border-b border-border">
                <View className="flex-row items-center gap-2">
                  <Target size={14} color={colors.teal} />
                  <Text className="text-sm font-medium text-foreground flex-1">{goal.name}</Text>
                  <Badge variant="secondary">{goal.type}</Badge>
                </View>
                {goal.type === 'TARGET' && goal.targetValue && (
                  <View className="gap-0.5">
                    <View className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <View className="h-full bg-teal rounded-full" style={{ width: `${progress * 100}%` }} />
                    </View>
                    <Text className="text-[10px] text-muted-foreground">{goal.currentValue ?? 0} / {goal.targetValue}</Text>
                  </View>
                )}
                {goal.type === 'HABIT' && <Text className="text-xs text-muted-foreground">{goal.frequencyPerWeek ?? '-'}x per week</Text>}
              </View>
            );
          })}
        </CardContent>
      </Card>

      {/* Diary Entries */}
      <Card>
        <CardContent className="py-4 px-4 gap-3">
          <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Diary Entries</Text>

          {/* Date picker */}
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d.toISOString().split('T')[0]!); }}>
              <Text className="text-teal text-sm">← Prev</Text>
            </TouchableOpacity>
            <Text className="text-sm text-foreground">
              {selectedDate === today ? 'Today' : new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
            </Text>
            <TouchableOpacity onPress={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); if (d <= new Date()) setSelectedDate(d.toISOString().split('T')[0]!); }}>
              <Text className={`text-sm ${selectedDate === today ? 'text-muted' : 'text-teal'}`}>Next →</Text>
            </TouchableOpacity>
          </View>

          {entryList.length === 0 ? (
            <Text className="text-xs text-muted-foreground">No entries for this date.</Text>
          ) : (
            entryList.map((entry: any) => {
              const info = ENTRY_ICONS[entry.type] ?? { icon: CalendarIcon, color: colors.mutedForeground };
              const Icon = info.icon;
              return (
                <View key={entry.id} className="flex-row items-center gap-2 py-2 border-b border-border">
                  <View className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: info.color + '20' }}>
                    <Icon size={14} color={info.color} />
                  </View>
                  <Text className="text-sm text-foreground flex-1">{entry.type?.replace(/_/g, ' ')}</Text>
                </View>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardContent className="py-4 px-4 gap-3">
          <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Comments</Text>
          {commentList.map((comment: any) => (
            <View key={comment.id} className="gap-1 py-2 border-b border-border">
              <Text className="text-sm text-foreground">{comment.content}</Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-muted-foreground">{comment.user?.name} · {formatMessageTime(String(comment.createdAt))}</Text>
                <TouchableOpacity onPress={() => {
                  showAlert({ title: 'Delete', message: 'Delete this comment?', actions: [
                    { label: 'Delete', variant: 'destructive', onPress: () => deleteComment.mutate({ commentId: comment.id } as any, { onSuccess: () => refetchComments() }) },
                    { label: 'Cancel', variant: 'outline' },
                  ]});
                }}>
                  <Trash2 size={12} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View className="flex-row items-end gap-2">
            <View className="flex-1 bg-card border border-border rounded-lg px-3 py-2">
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Add a comment..."
                placeholderTextColor={colors.mutedForeground}
                className="text-sm text-foreground"
                style={{ fontSize: 14, padding: 0, margin: 0 }}
              />
            </View>
            <TouchableOpacity
              onPress={handleAddComment}
              disabled={!commentText.trim()}
              className={`w-9 h-9 rounded-full items-center justify-center ${commentText.trim() ? 'bg-primary' : 'bg-secondary'}`}
            >
              <Send size={16} color={commentText.trim() ? '#fff' : colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </CardContent>
      </Card>
    </View>
  );
};

// ===== NOTES TAB =====
const NotesTab = ({ clientRosterId }: { clientRosterId: string }) => {
  const { showAlert } = useAlert();
  const { data: notes, refetch } = trpc.clientRoster.getNotes.useQuery({ clientRosterId });
  const addNote = trpc.clientRoster.addNote.useMutation();
  const deleteNote = trpc.clientRoster.deleteNote.useMutation();
  const [newNote, setNewNote] = useState('');

  const notesList = (notes ?? []) as any[];

  return (
    <View className="gap-4">
      <Card>
        <CardContent className="py-4 px-4 gap-3">
          <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Private Notes</Text>
          <Text className="text-xs text-muted-foreground">Only visible to you. Keep track of client preferences, goals, and session notes.</Text>
          <Input
            value={newNote}
            onChangeText={setNewNote}
            placeholder="Add a note about this client..."
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-muted-foreground">{newNote.length}/2000</Text>
            <Button size="sm" onPress={() => {
              if (!newNote.trim()) return;
              addNote.mutate({ clientRosterId, content: newNote.trim() } as any, {
                onSuccess: () => { refetch(); setNewNote(''); },
                onError: () => showAlert({ title: 'Error', message: 'Failed to add note' }),
              });
            }} disabled={!newNote.trim() || newNote.length > 2000} loading={addNote.isPending}>
              <View className="flex-row items-center gap-1">
                <Plus size={14} color="#fff" />
                <Text className="text-sm font-semibold text-white">Add Note</Text>
              </View>
            </Button>
          </View>
        </CardContent>
      </Card>

      {notesList.length === 0 ? (
        <Text className="text-sm text-muted-foreground text-center py-6">No notes yet.</Text>
      ) : (
        notesList.map((note: any) => (
          <Card key={note.id}>
            <CardContent className="py-3 px-4 gap-2">
              <Text className="text-sm text-foreground" style={{ whiteSpace: 'pre-wrap' } as any}>{note.content}</Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-muted-foreground">
                  {new Date(note.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
                <TouchableOpacity onPress={() => {
                  showAlert({ title: 'Delete Note', message: 'Are you sure?', actions: [
                    { label: 'Delete', variant: 'destructive', onPress: () => deleteNote.mutate({ noteId: note.id } as any, { onSuccess: () => refetch() }) },
                    { label: 'Cancel', variant: 'outline' },
                  ]});
                }}>
                  <Trash2 size={14} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>
        ))
      )}
    </View>
  );
};

// ===== MAIN SCREEN =====
const ClientDetailScreen = () => {
  const { showAlert } = useAlert();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');

  const { data: client, isLoading, refetch } = trpc.clientRoster.get.useQuery(
    { id: id ?? '' },
    { enabled: !!id },
  );
  const updateStatus = trpc.clientRoster.updateStatus.useMutation();
  const utils = trpc.useUtils();

  const c = client as any;
  const name = c?.connection?.sender?.name ?? c?.connection?.name ?? 'Client';
  const image = c?.connection?.sender?.traineeProfile?.avatarUrl ?? c?.connection?.sender?.image ?? null;
  const email = c?.connection?.sender?.email ?? '';
  const status = c?.status ?? 'ACTIVE';
  const clientUserId = c?.connection?.sender?.id ?? '';
  const isDisconnected = status === 'DISCONNECTED';

  const handleStatusChange = (newStatus: string) => {
    if (!id) return;
    updateStatus.mutate(
      { clientRosterId: id, status: newStatus } as any,
      { onSuccess: () => { utils.clientRoster.get.invalidate({ id }); utils.clientRoster.list.invalidate(); } },
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Skeleton className="h-5 w-32 rounded" />
        </View>
        <View className="px-4 py-6 gap-4">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">{name}</Text>
      </View>

      <TabBar
        tabs={[
          { key: 'overview' as Tab, label: 'Overview' },
          { key: 'plans' as Tab, label: 'Plans' },
          ...(clientUserId ? [{ key: 'progress' as Tab, label: 'Progress' }] : []),
          { key: 'notes' as Tab, label: 'Notes' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-2 gap-4 pb-8"
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.teal} />}
      >
        {tab === 'overview' && (
          <>
            <Card>
              <CardContent className="py-5 px-4 gap-3">
                <View className="flex-row items-center gap-4">
                  {image ? (
                    <Image source={{ uri: image }} className="w-16 h-16 rounded-full" />
                  ) : (
                    <View className="w-16 h-16 rounded-full bg-secondary items-center justify-center">
                      <Text className="text-xl font-bold text-foreground">{name.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <View className="flex-1 gap-0.5">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-lg font-semibold text-foreground">{name}</Text>
                      {isDisconnected && <Badge variant="destructive">Disconnected</Badge>}
                    </View>
                    {email && <Text className="text-sm text-muted-foreground">{email}</Text>}
                    <Text className="text-xs text-muted-foreground">Client since {formatDistanceToNow(String(c?.createdAt))} ago</Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {!isDisconnected && (
              <Card>
                <CardContent className="py-4 px-4 gap-3">
                  <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Status</Text>
                  <PillSelect options={STATUSES} value={status} onChange={handleStatusChange} />
                </CardContent>
              </Card>
            )}

            <View className="gap-2">
              {!isDisconnected && (
                <>
                  <Button onPress={() => {
                    const connectionId = c?.connection?.id;
                    if (connectionId) router.push(`/messages/${connectionId}`);
                  }}>
                    <View className="flex-row items-center gap-2">
                      <MessageCircle size={16} color="#fff" />
                      <Text className="text-white font-semibold">Message Client</Text>
                    </View>
                  </Button>
                  <Button variant="outline" onPress={() => router.push(`/bookings/create`)}>
                    <View className="flex-row items-center gap-2">
                      <CalendarIcon size={16} color={colors.foreground} />
                      <Text className="text-foreground font-semibold">Book Session</Text>
                    </View>
                  </Button>
                </>
              )}
              {!isDisconnected && (
                <Button variant="ghost" onPress={() => {
                  showAlert({ title: 'Disconnect Client', message: `Remove ${name} from your client list?`, actions: [
                    { label: 'Disconnect', variant: 'destructive', onPress: () => { handleStatusChange('DISCONNECTED'); router.back(); } },
                    { label: 'Cancel', variant: 'outline' },
                  ]});
                }}>
                  <View className="flex-row items-center gap-2">
                    <UserMinus size={16} color={colors.destructive} />
                    <Text className="text-destructive font-semibold">Disconnect Client</Text>
                  </View>
                </Button>
              )}
            </View>
          </>
        )}

        {tab === 'plans' && id && <PlansTab clientRosterId={id} isDisconnected={isDisconnected} />}
        {tab === 'progress' && clientUserId && id && <ProgressTab clientRosterId={id} clientUserId={clientUserId} />}
        {tab === 'notes' && id && <NotesTab clientRosterId={id} />}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ClientDetailScreen;
