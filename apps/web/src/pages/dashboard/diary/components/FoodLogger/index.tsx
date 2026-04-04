import { useState } from 'react';
import { UtensilsCrossed, Plus } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Label,
} from '@/components/ui';
import { useLogFood, useDeleteFoodEntry, useUpdateFoodEntry } from '@/api/diary';
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

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  servingSize: number;
  servingUnit: string;
  thumbnailUrl: string | null;
}

interface EditValues {
  servingSize: string;
  calories: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
}

interface FoodLoggerProps {
  date: string;
  entry?: {
    id: string;
    foodEntries?: Array<FoodEntry & { mealType: string }>;
  } | null;
}

export const FoodLogger = ({ date, entry }: FoodLoggerProps) => {
  const [searchMealType, setSearchMealType] = useState<(typeof MEAL_TYPES)[number] | null>(null);
  const [editingFood, setEditingFood] = useState<FoodEntry | null>(null);
  const [editValues, setEditValues] = useState<EditValues>({
    servingSize: '',
    calories: '',
    proteinG: '',
    carbsG: '',
    fatG: '',
  });
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const logFood = useLogFood();
  const deleteFoodEntry = useDeleteFoodEntry();
  const updateFoodEntry = useUpdateFoodEntry();

  const foodEntries = entry?.foodEntries ?? [];

  const handleAddFood = (food: Parameters<typeof logFood.mutate>[0]['items'][0]) => {
    logFood.mutate({ date, items: [food] });
  };

  const handleDeleteFood = (id: string) => {
    deleteFoodEntry.mutate({ id });
  };

  const handleEditFood = (foodEntry: FoodEntry) => {
    setEditingFood(foodEntry);
    setEditValues({
      servingSize: String(foodEntry.servingSize),
      calories: String(foodEntry.calories),
      proteinG: foodEntry.proteinG != null ? String(foodEntry.proteinG) : '',
      carbsG: foodEntry.carbsG != null ? String(foodEntry.carbsG) : '',
      fatG: foodEntry.fatG != null ? String(foodEntry.fatG) : '',
    });
    setConfirmingDelete(false);
  };

  const handleCloseEdit = () => {
    setEditingFood(null);
    setConfirmingDelete(false);
  };

  const handleSaveEdit = () => {
    if (!editingFood) return;
    updateFoodEntry.mutate(
      {
        id: editingFood.id,
        servingSize: parseFloat(editValues.servingSize) || 0,
        calories: parseInt(editValues.calories, 10) || 0,
        proteinG: editValues.proteinG ? parseFloat(editValues.proteinG) : null,
        carbsG: editValues.carbsG ? parseFloat(editValues.carbsG) : null,
        fatG: editValues.fatG ? parseFloat(editValues.fatG) : null,
      },
      { onSuccess: handleCloseEdit },
    );
  };

  const handleDeleteFromEdit = () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    if (!editingFood) return;
    deleteFoodEntry.mutate({ id: editingFood.id }, { onSuccess: handleCloseEdit });
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
            const mealEntries = foodEntries.filter((e) => e.mealType === mealType);
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
                        onEdit={handleEditFood}
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
            onOpenChange={(open) => {
              if (!open) setSearchMealType(null);
            }}
            mealType={searchMealType}
            onAddFood={handleAddFood}
          />
        )}

        <Dialog open={!!editingFood} onOpenChange={(open) => !open && handleCloseEdit()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="capitalize">{editingFood?.name}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-serving-size">Serving Size</Label>
                <Input
                  id="edit-serving-size"
                  type="number"
                  step="any"
                  value={editValues.servingSize}
                  onChange={(e) => setEditValues((v) => ({ ...v, servingSize: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-calories">Calories</Label>
                <Input
                  id="edit-calories"
                  type="number"
                  value={editValues.calories}
                  onChange={(e) => setEditValues((v) => ({ ...v, calories: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-protein">Protein (g)</Label>
                <Input
                  id="edit-protein"
                  type="number"
                  step="any"
                  value={editValues.proteinG}
                  onChange={(e) => setEditValues((v) => ({ ...v, proteinG: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-carbs">Carbs (g)</Label>
                <Input
                  id="edit-carbs"
                  type="number"
                  step="any"
                  value={editValues.carbsG}
                  onChange={(e) => setEditValues((v) => ({ ...v, carbsG: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-fat">Fat (g)</Label>
                <Input
                  id="edit-fat"
                  type="number"
                  step="any"
                  value={editValues.fatG}
                  onChange={(e) => setEditValues((v) => ({ ...v, fatG: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter className="flex-row gap-2 sm:justify-between">
              <Button
                variant="destructive"
                onClick={handleDeleteFromEdit}
                disabled={deleteFoodEntry.isPending}
              >
                {confirmingDelete ? 'Confirm Delete?' : 'Delete'}
              </Button>
              <Button onClick={handleSaveEdit} disabled={updateFoodEntry.isPending}>
                {updateFoodEntry.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
