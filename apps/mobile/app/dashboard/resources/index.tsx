import { useState } from 'react';
import { View, FlatList, RefreshControl, Alert, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Dumbbell, ChefHat, ClipboardList, UtensilsCrossed,
  Plus, Trash2, X, Search,
} from 'lucide-react-native';
import { TouchableOpacity, TextInput } from 'react-native';
import { Text, Button, Input, Card, CardContent, Skeleton, Badge, TabBar, ListPicker, type ListPickerItem } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { colors } from '@/constants/theme';

type Tab = 'exercises' | 'recipes' | 'workouts' | 'meals';

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'exercises', label: 'Exercises', icon: Dumbbell },
  { key: 'recipes', label: 'Recipes', icon: ChefHat },
  { key: 'workouts', label: 'Workouts', icon: ClipboardList },
  { key: 'meals', label: 'Meals', icon: UtensilsCrossed },
];

const MUSCLE_GROUPS = ['CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'FOREARMS', 'ABS', 'OBLIQUES', 'QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'FULL_BODY', 'CARDIO'];
const DIFFICULTY_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const RECIPE_TAGS = ['High Protein', 'Low Carb', 'Low Fat', 'Vegan', 'Vegetarian', 'Gluten Free', 'Keto', 'Quick & Easy', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-Workout', 'Post-Workout', 'Meal Prep'];
const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ChipToggle = ({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (v: string) => void }) => (
  <View className="flex-row flex-wrap gap-1">
    {options.map((opt) => {
      const active = selected.includes(opt);
      return (
        <TouchableOpacity key={opt} className={`px-2.5 py-1.5 rounded-lg border ${active ? 'border-teal bg-teal/10' : 'border-border'}`} onPress={() => onToggle(opt)}>
          <Text className={`text-xs ${active ? 'text-teal' : 'text-muted-foreground'}`}>{opt.replace(/_/g, ' ')}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

// ===== EXERCISE FORM =====
const ExerciseForm = ({ exercise, onClose }: { exercise?: any; onClose: () => void }) => {
  const isEdit = !!exercise;
  const create = trpc.exercise.create.useMutation();
  const update = trpc.exercise.update.useMutation();
  const utils = trpc.useUtils();
  const [name, setName] = useState(exercise?.name ?? '');
  const [description, setDescription] = useState(exercise?.description ?? '');
  const [instructions, setInstructions] = useState(exercise?.instructions ?? '');
  const [muscleGroups, setMuscleGroups] = useState<string[]>(exercise?.muscleGroups ?? []);
  const [difficulty, setDifficulty] = useState<string | null>(exercise?.difficulty ?? null);
  const toggleMuscle = (m: string) => setMuscleGroups((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Error', 'Name is required'); return; }
    const payload = { name, description: description || null, instructions: instructions || null, muscleGroups, equipment: [], difficulty } as any;
    const mutation = isEdit ? update.mutateAsync({ ...payload, id: exercise.id }) : create.mutateAsync(payload);
    mutation.then(() => { utils.exercise.list.invalidate(); onClose(); }).catch(() => Alert.alert('Error', 'Failed to save'));
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
          <Text className="text-base font-semibold text-foreground">{isEdit ? 'Edit Exercise' : 'New Exercise'}</Text>
          <TouchableOpacity onPress={onClose}><X size={24} color={colors.foreground} /></TouchableOpacity>
        </View>
        <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-4 pb-8" keyboardShouldPersistTaps="handled">
          <Input label="Name" value={name} onChangeText={setName} placeholder="e.g. Barbell Squat" />
          <Input label="Description (optional)" value={description} onChangeText={setDescription} multiline style={{ minHeight: 60, textAlignVertical: 'top' }} />
          <Input label="Instructions" value={instructions} onChangeText={setInstructions} multiline numberOfLines={4} style={{ minHeight: 80, textAlignVertical: 'top' }} placeholder="Step-by-step instructions..." />
          <Text className="text-xs font-medium text-foreground">Muscle Groups</Text>
          <ChipToggle options={MUSCLE_GROUPS} selected={muscleGroups} onToggle={toggleMuscle} />
          <Text className="text-xs font-medium text-foreground">Difficulty</Text>
          <View className="flex-row gap-2">
            {DIFFICULTY_LEVELS.map((d) => (
              <TouchableOpacity key={d} className={`flex-1 items-center py-2 rounded-lg border ${difficulty === d ? 'border-teal bg-teal/10' : 'border-border'}`} onPress={() => setDifficulty(difficulty === d ? null : d)}>
                <Text className={`text-xs ${difficulty === d ? 'text-teal' : 'text-muted-foreground'}`}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Button onPress={handleSave} loading={create.isPending || update.isPending}>{isEdit ? 'Update' : 'Create'}</Button>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// ===== RECIPE FORM =====
const RecipeForm = ({ recipe, onClose }: { recipe?: any; onClose: () => void }) => {
  const isEdit = !!recipe;
  const create = trpc.recipe.create.useMutation();
  const update = trpc.recipe.update.useMutation();
  const utils = trpc.useUtils();
  const [name, setName] = useState(recipe?.name ?? '');
  const [description, setDescription] = useState(recipe?.description ?? '');
  const [instructions, setInstructions] = useState(recipe?.instructions ?? '');
  const [calories, setCalories] = useState(String(recipe?.calories ?? ''));
  const [proteinG, setProteinG] = useState(String(recipe?.proteinG ?? ''));
  const [carbsG, setCarbsG] = useState(String(recipe?.carbsG ?? ''));
  const [fatG, setFatG] = useState(String(recipe?.fatG ?? ''));
  const [prepTimeMin, setPrepTimeMin] = useState(String(recipe?.prepTimeMin ?? ''));
  const [cookTimeMin, setCookTimeMin] = useState(String(recipe?.cookTimeMin ?? ''));
  const [servings, setServings] = useState(String(recipe?.servings ?? ''));
  const [tags, setTags] = useState<string[]>(recipe?.tags ?? []);
  const [ingredients, setIngredients] = useState<{ name: string; quantity: string; unit: string }[]>(
    recipe?.ingredients?.length ? recipe.ingredients : [{ name: '', quantity: '', unit: '' }],
  );
  const toggleTag = (t: string) => setTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  const num = (v: string) => v ? parseFloat(v) : null;
  const int = (v: string) => v ? parseInt(v) : null;

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Error', 'Name is required'); return; }
    if (!instructions.trim()) { Alert.alert('Error', 'Instructions are required'); return; }
    const payload = {
      name, description: description || null, instructions,
      calories: int(calories), proteinG: num(proteinG), carbsG: num(carbsG), fatG: num(fatG),
      prepTimeMin: int(prepTimeMin), cookTimeMin: int(cookTimeMin), servings: int(servings),
      tags, ingredients: ingredients.filter((i) => i.name.trim()),
    } as any;
    const mutation = isEdit ? update.mutateAsync({ ...payload, id: recipe.id }) : create.mutateAsync(payload);
    mutation.then(() => { utils.recipe.list.invalidate(); onClose(); }).catch(() => Alert.alert('Error', 'Failed to save'));
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
          <Text className="text-base font-semibold text-foreground">{isEdit ? 'Edit Recipe' : 'New Recipe'}</Text>
          <TouchableOpacity onPress={onClose}><X size={24} color={colors.foreground} /></TouchableOpacity>
        </View>
        <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-4 pb-8" keyboardShouldPersistTaps="handled">
          <Input label="Name" value={name} onChangeText={setName} placeholder="e.g. Chicken & Rice Bowl" />
          <Input label="Description (optional)" value={description} onChangeText={setDescription} multiline style={{ minHeight: 50, textAlignVertical: 'top' }} />
          <Input label="Instructions" value={instructions} onChangeText={setInstructions} multiline numberOfLines={6} style={{ minHeight: 100, textAlignVertical: 'top' }} />

          <Text className="text-xs font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Ingredients</Text>
          {ingredients.map((ing, i) => (
            <View key={i} className="flex-row gap-1 items-end">
              <View className="flex-[2]"><Input label={i === 0 ? 'Name' : undefined} value={ing.name} onChangeText={(v) => { const u = [...ingredients]; u[i] = { ...u[i], name: v }; setIngredients(u); }} placeholder="Chicken" /></View>
              <View className="flex-1"><Input label={i === 0 ? 'Qty' : undefined} value={ing.quantity} onChangeText={(v) => { const u = [...ingredients]; u[i] = { ...u[i], quantity: v }; setIngredients(u); }} placeholder="200" /></View>
              <View className="flex-1"><Input label={i === 0 ? 'Unit' : undefined} value={ing.unit} onChangeText={(v) => { const u = [...ingredients]; u[i] = { ...u[i], unit: v }; setIngredients(u); }} placeholder="g" /></View>
              <TouchableOpacity onPress={() => { if (ingredients.length > 1) setIngredients(ingredients.filter((_, j) => j !== i)); }} className="pb-1">
                <Trash2 size={14} color={ingredients.length > 1 ? colors.destructive : colors.muted} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={() => setIngredients([...ingredients, { name: '', quantity: '', unit: '' }])} className="flex-row items-center gap-1">
            <Plus size={14} color={colors.teal} /><Text className="text-xs text-teal">Add Ingredient</Text>
          </TouchableOpacity>

          <Text className="text-xs font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Nutrition</Text>
          <View className="flex-row gap-2">
            <View className="flex-1"><Input label="Calories" value={calories} onChangeText={setCalories} keyboardType="number-pad" /></View>
            <View className="flex-1"><Input label="Protein (g)" value={proteinG} onChangeText={setProteinG} keyboardType="decimal-pad" /></View>
          </View>
          <View className="flex-row gap-2">
            <View className="flex-1"><Input label="Carbs (g)" value={carbsG} onChangeText={setCarbsG} keyboardType="decimal-pad" /></View>
            <View className="flex-1"><Input label="Fat (g)" value={fatG} onChangeText={setFatG} keyboardType="decimal-pad" /></View>
          </View>
          <View className="flex-row gap-2">
            <View className="flex-1"><Input label="Prep (min)" value={prepTimeMin} onChangeText={setPrepTimeMin} keyboardType="number-pad" /></View>
            <View className="flex-1"><Input label="Cook (min)" value={cookTimeMin} onChangeText={setCookTimeMin} keyboardType="number-pad" /></View>
            <View className="flex-1"><Input label="Servings" value={servings} onChangeText={setServings} keyboardType="number-pad" /></View>
          </View>

          <Text className="text-xs font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Tags</Text>
          <ChipToggle options={RECIPE_TAGS} selected={tags} onToggle={toggleTag} />
          <Button onPress={handleSave} loading={create.isPending || update.isPending}>{isEdit ? 'Update' : 'Create'}</Button>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// ===== WORKOUT PLAN FORM =====
const WorkoutPlanForm = ({ plan, onClose }: { plan?: any; onClose: () => void }) => {
  const isEdit = !!plan;
  const create = trpc.workoutPlan.create.useMutation();
  const update = trpc.workoutPlan.update.useMutation();
  const setExercisesMut = trpc.workoutPlan.setExercises.useMutation();
  const { data: exerciseData } = trpc.exercise.list.useQuery({ limit: 50 });
  const utils = trpc.useUtils();
  const [name, setName] = useState(plan?.name ?? '');
  const [description, setDescription] = useState(plan?.description ?? '');
  const [exercises, setExercises] = useState<any[]>(plan?.exercises ?? []);
  const [showPicker, setShowPicker] = useState(false);

  const allExercises = (exerciseData as any)?.exercises ?? [];
  const addedIds = new Set(exercises.map((e: any) => e.exerciseId));
  const pickerItems: ListPickerItem[] = allExercises.filter((e: any) => !addedIds.has(e.id)).map((e: any) => ({ id: e.id, label: e.name, description: e.difficulty ?? undefined }));

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Name is required'); return; }
    try {
      let planId = plan?.id;
      if (isEdit) { await update.mutateAsync({ id: planId, name, description: description || null }); }
      else { const r = await create.mutateAsync({ name, description: description || null }); planId = (r as any).id; }
      if (planId && exercises.length > 0) {
        await setExercisesMut.mutateAsync({ id: planId, exercises: exercises.map((e: any, i: number) => ({ exerciseId: e.exerciseId, sets: e.sets ?? 3, reps: e.reps ?? '', restSeconds: e.restSeconds ?? 60, notes: e.notes ?? '', sortOrder: i })) } as any);
      }
      utils.workoutPlan.list.invalidate(); onClose();
    } catch { Alert.alert('Error', 'Failed to save'); }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
          <Text className="text-base font-semibold text-foreground">{isEdit ? 'Edit Workout Plan' : 'New Workout Plan'}</Text>
          <TouchableOpacity onPress={onClose}><X size={24} color={colors.foreground} /></TouchableOpacity>
        </View>
        <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-4 pb-8" keyboardShouldPersistTaps="handled">
          <Input label="Plan Name" value={name} onChangeText={setName} placeholder="e.g. Upper Body Strength" />
          <Input label="Description (optional)" value={description} onChangeText={setDescription} multiline style={{ minHeight: 50, textAlignVertical: 'top' }} />
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Exercises</Text>
            <TouchableOpacity onPress={() => setShowPicker(true)}><Plus size={18} color={colors.teal} /></TouchableOpacity>
          </View>
          {exercises.length === 0 && <Text className="text-xs text-muted-foreground">No exercises added. Tap + to add.</Text>}
          {exercises.map((ex: any, i: number) => (
            <Card key={`${ex.exerciseId}-${i}`}>
              <CardContent className="py-3 px-4 gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-foreground">{ex.exerciseName ?? ex.exercise?.name ?? 'Exercise'}</Text>
                  <TouchableOpacity onPress={() => setExercises(exercises.filter((_: any, j: number) => j !== i))}><Trash2 size={14} color={colors.destructive} /></TouchableOpacity>
                </View>
                <View className="flex-row gap-2">
                  <View className="flex-1"><Input label="Sets" value={String(ex.sets ?? 3)} onChangeText={(v) => { const u = [...exercises]; u[i] = { ...u[i], sets: parseInt(v) || 3 }; setExercises(u); }} keyboardType="number-pad" /></View>
                  <View className="flex-1"><Input label="Reps" value={ex.reps ?? ''} onChangeText={(v) => { const u = [...exercises]; u[i] = { ...u[i], reps: v }; setExercises(u); }} placeholder="8-12" /></View>
                  <View className="flex-1"><Input label="Rest (s)" value={String(ex.restSeconds ?? 60)} onChangeText={(v) => { const u = [...exercises]; u[i] = { ...u[i], restSeconds: parseInt(v) || 60 }; setExercises(u); }} keyboardType="number-pad" /></View>
                </View>
                <Input label="Notes" value={ex.notes ?? ''} onChangeText={(v) => { const u = [...exercises]; u[i] = { ...u[i], notes: v }; setExercises(u); }} placeholder="Optional notes..." />
              </CardContent>
            </Card>
          ))}
          <Button onPress={handleSave} loading={create.isPending || update.isPending || setExercisesMut.isPending}>{isEdit ? 'Update' : 'Create'}</Button>
        </ScrollView>
        <ListPicker visible={showPicker} onClose={() => setShowPicker(false)} title="Add Exercise" items={pickerItems}
          onSelect={(item) => setExercises([...exercises, { exerciseId: item.id, exerciseName: item.label, sets: 3, reps: '', restSeconds: 60, notes: '' }])} />
      </SafeAreaView>
    </Modal>
  );
};

// ===== MEAL PLAN FORM =====
const MealPlanForm = ({ plan, onClose }: { plan?: any; onClose: () => void }) => {
  const isEdit = !!plan;
  const create = trpc.mealPlan.create.useMutation();
  const update = trpc.mealPlan.update.useMutation();
  const setRecipesMut = trpc.mealPlan.setRecipes.useMutation();
  const { data: recipeData } = trpc.recipe.list.useQuery({ limit: 50 });
  const utils = trpc.useUtils();
  const [name, setName] = useState(plan?.name ?? '');
  const [description, setDescription] = useState(plan?.description ?? '');
  const [recipes, setRecipes] = useState<any[]>(plan?.recipes ?? []);
  const [showPicker, setShowPicker] = useState(false);

  const allRecipes = (recipeData as any)?.recipes ?? [];
  const pickerItems: ListPickerItem[] = allRecipes.map((r: any) => ({ id: r.id, label: r.name, description: r.calories ? `${r.calories} kcal` : undefined }));

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Name is required'); return; }
    try {
      let planId = plan?.id;
      if (isEdit) { await update.mutateAsync({ id: planId, name, description: description || null }); }
      else { const r = await create.mutateAsync({ name, description: description || null }); planId = (r as any).id; }
      if (planId && recipes.length > 0) {
        await setRecipesMut.mutateAsync({ id: planId, recipes: recipes.map((r: any, i: number) => ({ recipeId: r.recipeId, dayOfWeek: r.dayOfWeek ?? null, mealType: r.mealType ?? null, sortOrder: i })) } as any);
      }
      utils.mealPlan.list.invalidate(); onClose();
    } catch { Alert.alert('Error', 'Failed to save'); }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
          <Text className="text-base font-semibold text-foreground">{isEdit ? 'Edit Meal Plan' : 'New Meal Plan'}</Text>
          <TouchableOpacity onPress={onClose}><X size={24} color={colors.foreground} /></TouchableOpacity>
        </View>
        <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-4 pb-8" keyboardShouldPersistTaps="handled">
          <Input label="Plan Name" value={name} onChangeText={setName} placeholder="e.g. Weekly Meal Prep" />
          <Input label="Description (optional)" value={description} onChangeText={setDescription} multiline style={{ minHeight: 50, textAlignVertical: 'top' }} />
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Recipes</Text>
            <TouchableOpacity onPress={() => setShowPicker(true)}><Plus size={18} color={colors.teal} /></TouchableOpacity>
          </View>
          {recipes.length === 0 && <Text className="text-xs text-muted-foreground">No recipes added. Tap + to add.</Text>}
          {recipes.map((rec: any, i: number) => (
            <Card key={`${rec.recipeId}-${i}`}>
              <CardContent className="py-3 px-4 gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-foreground">{rec.recipeName ?? rec.recipe?.name ?? 'Recipe'}</Text>
                  <TouchableOpacity onPress={() => setRecipes(recipes.filter((_: any, j: number) => j !== i))}><Trash2 size={14} color={colors.destructive} /></TouchableOpacity>
                </View>
                <View className="flex-row flex-wrap gap-1">
                  {DAY_NAMES.map((d, di) => (
                    <TouchableOpacity key={d} className={`px-2 py-1 rounded ${rec.dayOfWeek === di ? 'bg-teal' : 'bg-secondary'}`}
                      onPress={() => { const u = [...recipes]; u[i] = { ...u[i], dayOfWeek: rec.dayOfWeek === di ? null : di }; setRecipes(u); }}>
                      <Text className={`text-[10px] ${rec.dayOfWeek === di ? 'text-teal-foreground' : 'text-muted-foreground'}`}>{d.slice(0, 3)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View className="flex-row gap-1">
                  {MEAL_TYPES.map((m) => (
                    <TouchableOpacity key={m} className={`flex-1 items-center py-1.5 rounded-lg border ${rec.mealType === m ? 'border-teal bg-teal/10' : 'border-border'}`}
                      onPress={() => { const u = [...recipes]; u[i] = { ...u[i], mealType: rec.mealType === m ? null : m }; setRecipes(u); }}>
                      <Text className={`text-[10px] ${rec.mealType === m ? 'text-teal' : 'text-muted-foreground'}`}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </CardContent>
            </Card>
          ))}
          <Button onPress={handleSave} loading={create.isPending || update.isPending || setRecipesMut.isPending}>{isEdit ? 'Update' : 'Create'}</Button>
        </ScrollView>
        <ListPicker visible={showPicker} onClose={() => setShowPicker(false)} title="Add Recipe" items={pickerItems}
          onSelect={(item) => setRecipes([...recipes, { recipeId: item.id, recipeName: item.label, dayOfWeek: null, mealType: null }])} />
      </SafeAreaView>
    </Modal>
  );
};

// ===== MAIN SCREEN =====
const ResourcesScreen = () => {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('exercises');
  const [editItem, setEditItem] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  const exercises = trpc.exercise.list.useQuery({ search: search || undefined, limit: 50 });
  const recipes = trpc.recipe.list.useQuery({ search: search || undefined, limit: 50 });
  const workouts = trpc.workoutPlan.list.useQuery({ search: search || undefined, limit: 50 });
  const meals = trpc.mealPlan.list.useQuery({ search: search || undefined, limit: 50 });
  const deleteExercise = trpc.exercise.delete.useMutation();
  const deleteRecipe = trpc.recipe.delete.useMutation();
  const deleteWorkout = trpc.workoutPlan.delete.useMutation();
  const deleteMeal = trpc.mealPlan.delete.useMutation();
  const utils = trpc.useUtils();

  const dataMap: Record<Tab, { items: any[]; isLoading: boolean; refetch: () => void }> = {
    exercises: { items: (exercises.data as any)?.exercises ?? [], isLoading: exercises.isLoading, refetch: exercises.refetch },
    recipes: { items: (recipes.data as any)?.recipes ?? [], isLoading: recipes.isLoading, refetch: recipes.refetch },
    workouts: { items: (workouts.data as any)?.plans ?? [], isLoading: workouts.isLoading, refetch: workouts.refetch },
    meals: { items: (meals.data as any)?.plans ?? [], isLoading: meals.isLoading, refetch: meals.refetch },
  };
  const current = dataMap[tab];

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        const m: Record<Tab, any> = { exercises: deleteExercise, recipes: deleteRecipe, workouts: deleteWorkout, meals: deleteMeal };
        const k: Record<Tab, any> = { exercises: utils.exercise.list, recipes: utils.recipe.list, workouts: utils.workoutPlan.list, meals: utils.mealPlan.list };
        m[tab].mutate({ id }, { onSuccess: () => k[tab].invalidate() });
      }},
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} color={colors.foreground} /></TouchableOpacity>
          <Text className="text-base font-semibold text-foreground">Resources</Text>
        </View>
        <TouchableOpacity onPress={() => setShowCreate(true)} className="flex-row items-center gap-1">
          <Plus size={18} color={colors.teal} /><Text className="text-sm font-medium text-teal">New</Text>
        </TouchableOpacity>
      </View>

      <TabBar tabs={TABS} active={tab} onChange={(t) => { setTab(t); setSearch(''); }} />

      <View className="px-4 pb-2">
        <View className="flex-row items-center h-10 bg-card border border-border rounded-lg px-3">
          <Search size={16} color={colors.mutedForeground} />
          <TextInput value={search} onChangeText={setSearch} placeholder={`Search ${tab}...`} placeholderTextColor={colors.mutedForeground}
            className="flex-1 text-foreground ml-2" style={{ fontSize: 14, padding: 0, margin: 0 }} autoCapitalize="none" />
        </View>
      </View>

      {current.isLoading ? (
        <View className="px-4 gap-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</View>
      ) : (
        <FlatList data={current.items} keyExtractor={(item: any) => item.id}
          renderItem={({ item }) => (
            <Card className="mx-4 mb-2">
              <CardContent className="py-3 px-4 gap-1">
                <Text className="text-sm font-semibold text-foreground">{item.name}</Text>
                {item.description && <Text className="text-xs text-muted-foreground" numberOfLines={1}>{item.description}</Text>}
                {tab === 'exercises' && item.difficulty && <Badge variant="secondary">{item.difficulty}</Badge>}
                {tab === 'recipes' && item.calories && <Text className="text-xs text-teal">{item.calories} kcal</Text>}
                {tab === 'workouts' && <Text className="text-xs text-muted-foreground">{item._count?.exercises ?? 0} exercises</Text>}
                {tab === 'meals' && <Text className="text-xs text-muted-foreground">{item._count?.recipes ?? 0} recipes</Text>}
                <View className="flex-row gap-2 mt-1">
                  <TouchableOpacity className="bg-secondary rounded-lg px-3 py-1.5" onPress={() => setEditItem(item)}>
                    <Text className="text-xs text-foreground">Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="bg-secondary rounded-lg px-3 py-1.5" onPress={() => handleDelete(item.id, item.name)}>
                    <Text className="text-xs text-destructive">Delete</Text>
                  </TouchableOpacity>
                </View>
              </CardContent>
            </Card>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-12 gap-3">
              <Text className="text-base text-muted-foreground">No {tab} yet</Text>
              <Button size="sm" onPress={() => setShowCreate(true)}>Create</Button>
            </View>
          }
          refreshControl={<RefreshControl refreshing={false} onRefresh={current.refetch} tintColor={colors.teal} />}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}

      {(showCreate || editItem) && tab === 'exercises' && <ExerciseForm exercise={editItem} onClose={() => { setShowCreate(false); setEditItem(null); }} />}
      {(showCreate || editItem) && tab === 'recipes' && <RecipeForm recipe={editItem} onClose={() => { setShowCreate(false); setEditItem(null); }} />}
      {(showCreate || editItem) && tab === 'workouts' && <WorkoutPlanForm plan={editItem} onClose={() => { setShowCreate(false); setEditItem(null); }} />}
      {(showCreate || editItem) && tab === 'meals' && <MealPlanForm plan={editItem} onClose={() => { setShowCreate(false); setEditItem(null); }} />}
    </SafeAreaView>
  );
};

export default ResourcesScreen;
