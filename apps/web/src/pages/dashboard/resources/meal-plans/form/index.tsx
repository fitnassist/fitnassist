import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Salad, Plus, Trash2, Search, UtensilsCrossed } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
  Select,
  type SelectOption,
} from '@/components/ui';
import { PageLayout } from '@/components/layouts';
import { routes } from '@/config/routes';
import {
  useMealPlan,
  useCreateMealPlan,
  useUpdateMealPlan,
  useSetMealPlanRecipes,
} from '@/api/meal-plan';
import { useRecipes } from '@/api/recipe';
import { createMealPlanSchema } from '@fitnassist/schemas';
import type { CreateMealPlanInput, MealPlanRecipeItem } from '@fitnassist/schemas';
import type { MealType } from '@fitnassist/database';

const DAY_OPTIONS: SelectOption[] = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

const MEAL_TYPE_OPTIONS: SelectOption[] = [
  { value: 'BREAKFAST', label: 'Breakfast' },
  { value: 'LUNCH', label: 'Lunch' },
  { value: 'DINNER', label: 'Dinner' },
  { value: 'SNACK', label: 'Snack' },
];

interface PlanRecipe {
  tempId: string;
  recipeId: string;
  recipeName: string;
  dayOfWeek: number | null;
  mealType: MealType | null;
}

export const MealPlanFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: existing, isLoading: isLoadingPlan } = useMealPlan(id || '');
  const createPlan = useCreateMealPlan();
  const updatePlan = useUpdateMealPlan();
  const setRecipes = useSetMealPlanRecipes();

  const [isSaving, setIsSaving] = useState(false);
  const [planRecipes, setPlanRecipes] = useState<PlanRecipe[]>([]);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const { data: recipeData } = useRecipes({ search: recipeSearch || undefined, limit: 50 });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateMealPlanInput>({
    resolver: zodResolver(createMealPlanSchema),
    defaultValues: { name: '', description: '' },
  });

  // Populate form when editing
  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        description: existing.description ?? '',
      });
      setPlanRecipes(
        existing.recipes.map((mr, i) => ({
          tempId: `${mr.id}-${i}`,
          recipeId: mr.recipeId,
          recipeName: mr.recipe.name,
          dayOfWeek: mr.dayOfWeek,
          mealType: mr.mealType,
        })),
      );
    }
  }, [existing, reset]);

  const addRecipe = (recipe: { id: string; name: string }) => {
    setPlanRecipes((prev) => [
      ...prev,
      {
        tempId: `new-${Date.now()}-${Math.random()}`,
        recipeId: recipe.id,
        recipeName: recipe.name,
        dayOfWeek: null,
        mealType: null,
      },
    ]);
    setShowPicker(false);
    setRecipeSearch('');
  };

  const updateRecipe = (
    tempId: string,
    field: 'dayOfWeek' | 'mealType',
    value: number | string | null,
  ) => {
    setPlanRecipes((prev) => prev.map((r) => (r.tempId === tempId ? { ...r, [field]: value } : r)));
  };

  const removeRecipe = (tempId: string) => {
    setPlanRecipes((prev) => prev.filter((r) => r.tempId !== tempId));
  };

  const onSubmit = async (data: CreateMealPlanInput) => {
    setIsSaving(true);
    try {
      const cleaned = {
        ...data,
        description: data.description || null,
      };

      let planId = id;

      if (isEdit && id) {
        await updatePlan.mutateAsync({ id, ...cleaned });
      } else {
        const newPlan = await createPlan.mutateAsync(cleaned);
        planId = newPlan.id;
      }

      if (planId) {
        const recipeItems: MealPlanRecipeItem[] = planRecipes.map((r, i) => ({
          recipeId: r.recipeId,
          dayOfWeek: r.dayOfWeek,
          mealType: r.mealType,
          sortOrder: i,
        }));
        await setRecipes.mutateAsync({ id: planId, recipes: recipeItems });
      }

      navigate(`${routes.dashboardResources}?tab=meal-plans`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isEdit && isLoadingPlan) {
    return (
      <PageLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </PageLayout>
    );
  }

  const availableRecipes = recipeData?.recipes ?? [];

  return (
    <PageLayout>
      <PageLayout.Header
        title={isEdit ? 'Edit Meal Plan' : 'New Meal Plan'}
        icon={<Salad className="h-6 w-6 sm:h-8 sm:w-8" />}
        backLink={{ to: routes.dashboardResources, label: 'Back to Resources' }}
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...register('name')} placeholder="e.g. High Protein Weekly Plan" />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="What's this meal plan for?"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Recipes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recipes ({planRecipes.length})</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPicker(!showPicker)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Recipe
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Recipe picker */}
            {showPicker && (
              <div className="border rounded-lg p-3 bg-muted/50 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search your recipes..."
                    value={recipeSearch}
                    onChange={(e) => setRecipeSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {availableRecipes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-3">
                    {recipeData?.recipes.length === 0
                      ? 'No recipes in your library yet. Create some first!'
                      : 'No matching recipes found.'}
                  </p>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {availableRecipes.map((recipe) => (
                      <button
                        key={recipe.id}
                        type="button"
                        onClick={() => addRecipe(recipe)}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-background text-sm flex items-center gap-2"
                      >
                        <UtensilsCrossed className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{recipe.name}</span>
                        {recipe.calories && (
                          <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                            {recipe.calories} cal
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recipe list */}
            {planRecipes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No recipes added yet. Click "Add Recipe" to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {planRecipes.map((recipe) => (
                  <div key={recipe.tempId} className="border rounded-lg p-3 bg-background">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{recipe.recipeName}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRecipe(recipe.tempId)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Day</Label>
                            <Select
                              options={DAY_OPTIONS}
                              value={
                                recipe.dayOfWeek != null
                                  ? (DAY_OPTIONS.find(
                                      (o) => o.value === String(recipe.dayOfWeek),
                                    ) ?? null)
                                  : null
                              }
                              onChange={(opt) =>
                                updateRecipe(
                                  recipe.tempId,
                                  'dayOfWeek',
                                  opt ? parseInt(opt.value) : null,
                                )
                              }
                              placeholder="Any day"
                              isClearable
                              menuPlacement="auto"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Meal</Label>
                            <Select
                              options={MEAL_TYPE_OPTIONS}
                              value={
                                recipe.mealType
                                  ? (MEAL_TYPE_OPTIONS.find((o) => o.value === recipe.mealType) ??
                                    null)
                                  : null
                              }
                              onChange={(opt) =>
                                updateRecipe(recipe.tempId, 'mealType', opt ? opt.value : null)
                              }
                              placeholder="Any meal"
                              isClearable
                              menuPlacement="auto"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`${routes.dashboardResources}?tab=meal-plans`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Plan'}
          </Button>
        </div>
      </form>
    </PageLayout>
  );
};

export default MealPlanFormPage;
