import { useState } from 'react';
import { ClipboardList, Dumbbell, Salad, UtensilsCrossed, Play, Clock, Flame, ChevronRight } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ResponsiveTabs,
  TabsContent,
  Badge,
} from '@/components/ui';
import { PageLayout } from '@/components/layouts';
import { DetailDialog } from '@/components';
import { useTabParam } from '@/hooks';
import { useMyAssignments } from '@/api/client-roster';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MEAL_TYPE_LABELS: Record<string, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACK: 'Snack',
};

const MUSCLE_GROUP_LABELS: Record<string, string> = {
  CHEST: 'Chest',
  BACK: 'Back',
  SHOULDERS: 'Shoulders',
  BICEPS: 'Biceps',
  TRICEPS: 'Triceps',
  FOREARMS: 'Forearms',
  ABS: 'Abs',
  OBLIQUES: 'Obliques',
  QUADS: 'Quads',
  HAMSTRINGS: 'Hamstrings',
  GLUTES: 'Glutes',
  CALVES: 'Calves',
  TRAPS: 'Traps',
  LATS: 'Lats',
  LOWER_BACK: 'Lower Back',
  HIP_FLEXORS: 'Hip Flexors',
  ADDUCTORS: 'Adductors',
  ABDUCTORS: 'Abductors',
  FULL_BODY: 'Full Body',
  CARDIO: 'Cardio',
};

interface ExerciseDetail {
  name: string;
  description?: string | null;
  instructions?: string | null;
  videoUrl?: string | null;
  videoUploadUrl?: string | null;
  thumbnailUrl?: string | null;
  muscleGroups?: string[];
  equipment?: string[];
}

interface WorkoutExercise {
  id: string;
  sets?: number | null;
  reps?: string | null;
  restSeconds?: number | null;
  notes?: string | null;
  exercise: ExerciseDetail;
}

interface RecipeDetail {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  ingredients?: unknown;
  instructions: string;
  calories?: number | null;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
  prepTimeMin?: number | null;
  cookTimeMin?: number | null;
  servings?: number | null;
}

interface Ingredient {
  name: string;
  quantity?: string;
  unit?: string;
}

const ExerciseContent = ({ exercise, sets, reps, restSeconds, notes }: { exercise: ExerciseDetail; sets?: number | null; reps?: string | null; restSeconds?: number | null; notes?: string | null }) => {
  const videoUrl = exercise.videoUrl || exercise.videoUploadUrl;

  return (
    <div className="space-y-4">
      {exercise.thumbnailUrl && (
        <img src={exercise.thumbnailUrl} alt={exercise.name} className="w-full rounded-lg object-cover max-h-48" />
      )}

      {(sets || reps || restSeconds) && (
        <div className="flex flex-wrap gap-3">
          {sets && <Badge variant="secondary">{sets} sets</Badge>}
          {reps && <Badge variant="secondary">{reps} reps</Badge>}
          {restSeconds && <Badge variant="secondary">{restSeconds}s rest</Badge>}
        </div>
      )}

      {notes && (
        <div>
          <p className="text-sm font-medium mb-1">Notes</p>
          <p className="text-sm text-muted-foreground italic">{notes}</p>
        </div>
      )}

      {exercise.description && (
        <div>
          <p className="text-sm font-medium mb-1">Description</p>
          <p className="text-sm text-muted-foreground">{exercise.description}</p>
        </div>
      )}

      {exercise.instructions && (
        <div>
          <p className="text-sm font-medium mb-1">Instructions</p>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{exercise.instructions}</p>
        </div>
      )}

      {videoUrl && (
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <Play className="h-4 w-4" />
          Watch Video
        </a>
      )}

      {exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-1">Muscle Groups</p>
          <div className="flex flex-wrap gap-1.5">
            {exercise.muscleGroups.map(mg => (
              <Badge key={mg} variant="outline">{MUSCLE_GROUP_LABELS[mg] ?? mg}</Badge>
            ))}
          </div>
        </div>
      )}

      {exercise.equipment && exercise.equipment.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-1">Equipment</p>
          <div className="flex flex-wrap gap-1.5">
            {exercise.equipment.map(eq => (
              <Badge key={eq} variant="outline">{eq}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const RecipeContent = ({ recipe }: { recipe: RecipeDetail }) => {
  const ingredients = Array.isArray(recipe.ingredients) ? (recipe.ingredients as Ingredient[]) : [];
  const totalTime = (recipe.prepTimeMin ?? 0) + (recipe.cookTimeMin ?? 0);

  return (
    <div className="space-y-4">
      {recipe.imageUrl && (
        <img src={recipe.imageUrl} alt={recipe.name} className="w-full rounded-lg object-cover max-h-48" />
      )}

      {recipe.description && (
        <p className="text-sm text-muted-foreground">{recipe.description}</p>
      )}

      <div className="flex flex-wrap gap-3">
        {recipe.calories && (
          <Badge variant="secondary">
            <Flame className="h-3 w-3 mr-1" />
            {recipe.calories} cal
          </Badge>
        )}
        {totalTime > 0 && (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            {totalTime} min
          </Badge>
        )}
        {recipe.servings && (
          <Badge variant="secondary">{recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}</Badge>
        )}
      </div>

      {(recipe.proteinG || recipe.carbsG || recipe.fatG) && (
        <div className="grid grid-cols-3 gap-2 text-center">
          {recipe.proteinG != null && (
            <div className="p-2 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Protein</p>
              <p className="text-sm font-medium">{recipe.proteinG}g</p>
            </div>
          )}
          {recipe.carbsG != null && (
            <div className="p-2 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Carbs</p>
              <p className="text-sm font-medium">{recipe.carbsG}g</p>
            </div>
          )}
          {recipe.fatG != null && (
            <div className="p-2 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Fat</p>
              <p className="text-sm font-medium">{recipe.fatG}g</p>
            </div>
          )}
        </div>
      )}

      {ingredients.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Ingredients</p>
          <ul className="space-y-1">
            {ingredients.map((ing, i) => (
              <li key={i} className="text-sm text-muted-foreground flex gap-2">
                <span className="text-foreground">-</span>
                {ing.quantity && <span>{ing.quantity}</span>}
                {ing.unit && <span>{ing.unit}</span>}
                <span>{ing.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="text-sm font-medium mb-2">Instructions</p>
        <p className="text-sm text-muted-foreground whitespace-pre-line">{recipe.instructions}</p>
      </div>

      {(recipe.prepTimeMin || recipe.cookTimeMin) && (
        <div className="flex gap-4 text-sm text-muted-foreground">
          {recipe.prepTimeMin && <span>Prep: {recipe.prepTimeMin} min</span>}
          {recipe.cookTimeMin && <span>Cook: {recipe.cookTimeMin} min</span>}
        </div>
      )}
    </div>
  );
};

export const MyPlansPage = () => {
  const [activeTab, setActiveTab] = useTabParam('workout');
  const { data: assignments, isLoading } = useMyAssignments();
  const [selectedExercise, setSelectedExercise] = useState<{ exercise: ExerciseDetail; we: WorkoutExercise } | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null);

  if (isLoading) {
    return (
      <PageLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </PageLayout>
    );
  }

  const workoutPlans = (assignments ?? []).flatMap(a =>
    (a.workoutPlanAssignments ?? []).map(wpa => ({
      plan: wpa.workoutPlan,
      trainerName: a.trainer.user.name,
    }))
  );

  const mealPlans = (assignments ?? []).flatMap(a =>
    (a.mealPlanAssignments ?? []).map(mpa => ({
      plan: mpa.mealPlan,
      trainerName: a.trainer.user.name,
    }))
  );

  return (
    <PageLayout>
      <PageLayout.Header
        title="My Plans"
        description="Workout and meal plans assigned to you by your trainers."
        icon={<ClipboardList className="h-6 w-6 sm:h-8 sm:w-8" />}
      />
      <ResponsiveTabs
        value={activeTab}
        onValueChange={setActiveTab}
        options={[
          { value: 'workout', label: 'Workout Plans', icon: <Dumbbell className="h-4 w-4" /> },
          { value: 'meal', label: 'Meal Plans', icon: <Salad className="h-4 w-4" /> },
        ]}
        tabsListClassName="mb-6"
      >
        <TabsContent value="workout">
          {workoutPlans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-1">No workout plans yet</h3>
                <p className="text-sm text-muted-foreground">
                  Your trainer hasn't assigned a workout plan to you yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {workoutPlans.map(({ plan, trainerName }) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Dumbbell className="h-5 w-5 text-primary" />
                        {plan.name}
                      </CardTitle>
                      <span className="text-xs text-muted-foreground">
                        From {trainerName}
                      </span>
                    </div>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    {plan.exercises.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No exercises in this plan.</p>
                    ) : (
                      <div className="space-y-2">
                        {plan.exercises.map((we, i) => (
                          <button
                            key={we.id}
                            type="button"
                            onClick={() => setSelectedExercise({ exercise: we.exercise, we })}
                            className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors text-left"
                          >
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{we.exercise.name}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                                {we.sets && <span>{we.sets} sets</span>}
                                {we.reps && <span>{we.reps} reps</span>}
                                {we.restSeconds && <span>{we.restSeconds}s rest</span>}
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="meal">
          {mealPlans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Salad className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-1">No meal plans yet</h3>
                <p className="text-sm text-muted-foreground">
                  Your trainer hasn't assigned a meal plan to you yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {mealPlans.map(({ plan, trainerName }) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Salad className="h-5 w-5 text-green-600 dark:text-green-400" />
                        {plan.name}
                      </CardTitle>
                      <span className="text-xs text-muted-foreground">
                        From {trainerName}
                      </span>
                    </div>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    {plan.recipes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No recipes in this plan.</p>
                    ) : (
                      <div className="space-y-2">
                        {plan.recipes.map((mr) => (
                          <button
                            key={mr.id}
                            type="button"
                            onClick={() => setSelectedRecipe(mr.recipe)}
                            className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors text-left"
                          >
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                              <UtensilsCrossed className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{mr.recipe.name}</p>
                              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                                {mr.dayOfWeek != null && (
                                  <span>{DAYS[mr.dayOfWeek]}</span>
                                )}
                                {mr.mealType && (
                                  <span>{MEAL_TYPE_LABELS[mr.mealType] ?? mr.mealType}</span>
                                )}
                                {mr.recipe.calories && (
                                  <span>{mr.recipe.calories} cal</span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </ResponsiveTabs>

      {/* Exercise Detail Dialog */}
      <DetailDialog
        open={!!selectedExercise}
        onOpenChange={(open) => !open && setSelectedExercise(null)}
        title={selectedExercise?.exercise.name ?? ''}
      >
        {selectedExercise && (
          <ExerciseContent
            exercise={selectedExercise.exercise}
            sets={selectedExercise.we.sets}
            reps={selectedExercise.we.reps}
            restSeconds={selectedExercise.we.restSeconds}
            notes={selectedExercise.we.notes}
          />
        )}
      </DetailDialog>

      {/* Recipe Detail Dialog */}
      <DetailDialog
        open={!!selectedRecipe}
        onOpenChange={(open) => !open && setSelectedRecipe(null)}
        title={selectedRecipe?.name ?? ''}
      >
        {selectedRecipe && <RecipeContent recipe={selectedRecipe} />}
      </DetailDialog>
    </PageLayout>
  );
};

export default MyPlansPage;
