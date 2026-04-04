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
  DialogDescription,
} from '@/components/ui';
import { useLogFood, useUpdateFoodEntry, useDeleteFoodEntry } from '@/api/diary';
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

interface EditingFood {
  id: string;
  name: string;
  calories: number;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  servingSize: number;
  servingUnit: string;
}

export const FoodLogger = ({ date, entry }: FoodLoggerProps) => {
  const [searchMealType, setSearchMealType] = useState<(typeof MEAL_TYPES)[number] | null>(null);
  const [editingFood, setEditingFood] = useState<EditingFood | null>(null);
  const [editValues, setEditValues] = useState({
    servingSize: '',
    calories: '',
    proteinG: '',
    carbsG: '',
    fatG: '',
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const logFood = useLogFood();
  const updateFoodEntry = useUpdateFoodEntry();
  const deleteFoodEntry = useDeleteFoodEntry();

  const foodEntries = entry?.foodEntries ?? [];

  const handleAddFood = (food: Parameters<typeof logFood.mutate>[0]['items'][0]) => {
    logFood.mutate({ date, items: [food] });
  };

  const handleDeleteFood = (id: string) => {
    deleteFoodEntry.mutate({ id });
  };

  const handleEditFood = (food: EditingFood) => {
    setEditingFood(food);
    setEditValues({
      servingSize: String(food.servingSize ?? 1),
      calories: String(food.calories ?? 0),
      proteinG: food.proteinG != null ? String(food.proteinG) : '',
      carbsG: food.carbsG != null ? String(food.carbsG) : '',
      fatG: food.fatG != null ? String(food.fatG) : '',
    });
    setConfirmDelete(false);
  };

  const handleSaveEdit = () => {
    if (!editingFood) return;
    updateFoodEntry.mutate(
      {
        id: editingFood.id,
        servingSize: parseFloat(editValues.servingSize) || undefined,
        calories: parseInt(editValues.calories) || undefined,
        proteinG: editValues.proteinG ? parseFloat(editValues.proteinG) : null,
        carbsG: editValues.carbsG ? parseFloat(editValues.carbsG) : null,
        fatG: editValues.fatG ? parseFloat(editValues.fatG) : null,
      },
      {
        onSuccess: () => setEditingFood(null),
      },
    );
  };

  const handleConfirmDelete = () => {
    if (!editingFood) return;
    deleteFoodEntry.mutate(
      { id: editingFood.id },
      {
        onSuccess: () => {
          setEditingFood(null);
          setConfirmDelete(false);
        },
      },
    );
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

        <Dialog
          open={!!editingFood}
          onOpenChange={(open) => {
            if (!open) {
              setEditingFood(null);
              setConfirmDelete(false);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="capitalize">{editingFood?.name ?? 'Edit Food'}</DialogTitle>
              <DialogDescription>Update the nutritional values for this entry.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div>
                <label className="text-sm font-medium">Serving Size</label>
                <input
                  type="number"
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={editValues.servingSize}
                  onChange={(e) => setEditValues((v) => ({ ...v, servingSize: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Calories</label>
                <input
                  type="number"
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={editValues.calories}
                  onChange={(e) => setEditValues((v) => ({ ...v, calories: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-sm font-medium">Protein (g)</label>
                  <input
                    type="number"
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={editValues.proteinG}
                    onChange={(e) => setEditValues((v) => ({ ...v, proteinG: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Carbs (g)</label>
                  <input
                    type="number"
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={editValues.carbsG}
                    onChange={(e) => setEditValues((v) => ({ ...v, carbsG: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Fat (g)</label>
                  <input
                    type="number"
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={editValues.fatG}
                    onChange={(e) => setEditValues((v) => ({ ...v, fatG: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="flex-row gap-2 sm:justify-between">
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-destructive">Are you sure?</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleConfirmDelete}
                    disabled={deleteFoodEntry.isPending}
                  >
                    {deleteFoodEntry.isPending ? 'Deleting...' : 'Confirm Delete'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
                  Delete
                </Button>
              )}
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
