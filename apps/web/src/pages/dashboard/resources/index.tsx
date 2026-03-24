import { BookOpen, Dumbbell, UtensilsCrossed, ClipboardList, Salad } from 'lucide-react';
import { ResponsiveTabs, TabsContent } from '@/components/ui';
import { PageLayout } from '@/components/layouts';
import { useTabParam } from '@/hooks';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { ExerciseList, RecipeList, WorkoutPlanList, MealPlanList } from './components';

export const ResourcesPage = () => {
  const [activeTab, setActiveTab] = useTabParam('exercises');
  const { hasAccess, requiredTier } = useFeatureAccess('resources');

  if (!hasAccess) {
    return (
      <PageLayout>
        <PageLayout.Header
          title="Resources"
          description="Manage your exercise library, recipes, and plans."
          icon={<BookOpen className="h-6 w-6 sm:h-8 sm:w-8" />}
        />
        <PageLayout.Content>
          <UpgradePrompt requiredTier={requiredTier} featureName="Resources" />
        </PageLayout.Content>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageLayout.Header
        title="Resources"
        description="Manage your exercise library, recipes, and plans."
        icon={<BookOpen className="h-6 w-6 sm:h-8 sm:w-8" />}
      />
      <ResponsiveTabs
        value={activeTab}
        onValueChange={setActiveTab}
        options={[
          { value: 'exercises', label: 'Exercises', icon: <Dumbbell className="h-4 w-4" /> },
          { value: 'recipes', label: 'Recipes', icon: <UtensilsCrossed className="h-4 w-4" /> },
          { value: 'workout-plans', label: 'Workout Plans', icon: <ClipboardList className="h-4 w-4" /> },
          { value: 'meal-plans', label: 'Meal Plans', icon: <Salad className="h-4 w-4" /> },
        ]}
        tabsListClassName="mb-6"
      >
        <TabsContent value="exercises">
          <ExerciseList />
        </TabsContent>
        <TabsContent value="recipes">
          <RecipeList />
        </TabsContent>
        <TabsContent value="workout-plans">
          <WorkoutPlanList />
        </TabsContent>
        <TabsContent value="meal-plans">
          <MealPlanList />
        </TabsContent>
      </ResponsiveTabs>
    </PageLayout>
  );
};

export default ResourcesPage;
