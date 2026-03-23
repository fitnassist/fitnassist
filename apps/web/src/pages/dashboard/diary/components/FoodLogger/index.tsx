import { useState } from 'react';
import { UtensilsCrossed, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { useLogFood, useDeleteFoodEntry } from '@/api/diary';
import { NutritionSummary } from './NutritionSummary';
import { FoodSearchModal } from './FoodSearchModal';
import { FoodEntryRow } from './FoodEntryRow';

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const;

const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACK: 'Snack',
};

interface FoodLoggerProps {
  date: string;
  entry?: {
    id: string;
    foodEntries?: Array<{
      id: string;
      name: string;
      mealType: string;
      calories: number;
      proteinG: number | null;
      carbsG: number | null;
      fatG: number | null;
      servingSize: number;
      servingUnit: string;
      thumbnailUrl: string | null;
    }>;
  } | null;
}

export const FoodLogger = ({ date, entry }: FoodLoggerProps) => {
  const [searchMealType, setSearchMealType] = useState<typeof MEAL_TYPES[number] | null>(null);
  const logFood = useLogFood();
  const deleteFoodEntry = useDeleteFoodEntry();

  const foodEntries = entry?.foodEntries ?? [];

  const handleAddFood = (food: Parameters<typeof logFood.mutate>[0]['items'][0]) => {
    logFood.mutate({ date, items: [food] });
  };

  const handleDeleteFood = (id: string) => {
    deleteFoodEntry.mutate({ id });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <UtensilsCrossed className="h-4 w-4 text-orange-500" />
          Food
        </CardTitle>
      </CardHeader>
      <CardContent>
        <NutritionSummary date={date} />

        <div className="mt-4 space-y-4">
          {MEAL_TYPES.map((mealType) => {
            const mealEntries = foodEntries.filter(e => e.mealType === mealType);
            return (
              <div key={mealType}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{MEAL_LABELS[mealType]}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={() => setSearchMealType(mealType)}
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </Button>
                </div>
                {mealEntries.length > 0 ? (
                  <div className="mt-1 divide-y">
                    {mealEntries.map((foodEntry) => (
                      <FoodEntryRow
                        key={foodEntry.id}
                        entry={foodEntry}
                        onDelete={handleDeleteFood}
                        isDeleting={deleteFoodEntry.isPending}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">No items logged</p>
                )}
              </div>
            );
          })}
        </div>

        {searchMealType && (
          <FoodSearchModal
            open={!!searchMealType}
            onOpenChange={(open) => { if (!open) setSearchMealType(null); }}
            mealType={searchMealType}
            onAddFood={handleAddFood}
          />
        )}
      </CardContent>
    </Card>
  );
};
