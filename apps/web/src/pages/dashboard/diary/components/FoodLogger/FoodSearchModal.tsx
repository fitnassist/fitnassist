import { useState, useCallback } from 'react';
import { Search, BookOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
} from '@/components/ui';
import { useSearchFood, useMyRecipes } from '@/api/diary';
import { useDebounce } from '@/hooks';

interface FoodSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  onAddFood: (food: {
    name: string;
    mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
    calories: number;
    proteinG?: number;
    carbsG?: number;
    fatG?: number;
    fibreG?: number;
    servingSize: number;
    servingUnit: string;
    externalId?: string;
    thumbnailUrl?: string;
  }) => void;
}

interface SelectedProduct {
  food_name: string;
  brand_name?: string;
  external_id?: string;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fibre_g?: number;
  serving_qty: number;
  serving_unit: string;
  thumbnail_url?: string;
}

type Tab = 'search' | 'recipes';

export const FoodSearchModal = ({ open, onOpenChange, mealType, onAddFood }: FoodSearchModalProps) => {
  const [tab, setTab] = useState<Tab>('search');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<SelectedProduct | null>(null);
  const [servingSize, setServingSize] = useState('1');
  const debouncedQuery = useDebounce(query, 300);

  const { data: searchResults, isLoading: isSearching } = useSearchFood(debouncedQuery);
  const { data: myRecipes } = useMyRecipes();

  const [recipeFilter, setRecipeFilter] = useState('');

  const filteredRecipes = myRecipes?.filter((r: { name: string }) =>
    r.name.toLowerCase().includes(recipeFilter.toLowerCase())
  );

  const handleSelect = useCallback((product: SelectedProduct) => {
    setSelected(product);
    setServingSize('1');
  }, []);

  const handleSelectRecipe = useCallback((recipe: {
    id: string;
    name: string;
    mealPlanName: string;
    mealType: string | null;
    calories: number | null;
    proteinG: number | null;
    carbsG: number | null;
    fatG: number | null;
    servings: number | null;
    imageUrl: string | null;
  }) => {
    handleSelect({
      food_name: recipe.name,
      brand_name: recipe.mealPlanName,
      calories: recipe.calories ?? 0,
      protein_g: recipe.proteinG ?? undefined,
      carbs_g: recipe.carbsG ?? undefined,
      fat_g: recipe.fatG ?? undefined,
      serving_qty: 1,
      serving_unit: recipe.servings ? `serving (1/${recipe.servings})` : 'serving',
      thumbnail_url: recipe.imageUrl ?? undefined,
    });
  }, [handleSelect]);

  const handleConfirm = useCallback(() => {
    if (!selected) return;
    const multiplier = parseFloat(servingSize);
    if (isNaN(multiplier) || multiplier <= 0) return;

    const name = selected.brand_name
      ? `${selected.food_name} (${selected.brand_name})`
      : selected.food_name;

    onAddFood({
      name,
      mealType,
      calories: Math.round(selected.calories * multiplier),
      proteinG: selected.protein_g ? Math.round(selected.protein_g * multiplier * 10) / 10 : undefined,
      carbsG: selected.carbs_g ? Math.round(selected.carbs_g * multiplier * 10) / 10 : undefined,
      fatG: selected.fat_g ? Math.round(selected.fat_g * multiplier * 10) / 10 : undefined,
      fibreG: selected.fibre_g ? Math.round(selected.fibre_g * multiplier * 10) / 10 : undefined,
      servingSize: multiplier * selected.serving_qty,
      servingUnit: selected.serving_unit,
      externalId: selected.external_id,
      thumbnailUrl: selected.thumbnail_url,
    });
    handleClose();
  }, [selected, servingSize, mealType, onAddFood]);

  const handleClose = () => {
    setQuery('');
    setSelected(null);
    setServingSize('1');
    setRecipeFilter('');
    setTab('search');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent aria-describedby={undefined} className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Food — {mealType.charAt(0) + mealType.slice(1).toLowerCase()}</DialogTitle>
        </DialogHeader>

        {!selected ? (
          <>
            {/* Tab switcher */}
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              <button
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === 'search' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setTab('search')}
              >
                <Search className="h-3.5 w-3.5" />
                Search
              </button>
              <button
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === 'recipes' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setTab('recipes')}
              >
                <BookOpen className="h-3.5 w-3.5" />
                My Recipes
                {myRecipes && myRecipes.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                    {myRecipes.length}
                  </span>
                )}
              </button>
            </div>

            {tab === 'search' ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search for a food..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                </div>

                {isSearching && (
                  <p className="py-4 text-center text-sm text-muted-foreground">Searching...</p>
                )}

                {searchResults && searchResults.products?.length > 0 && (
                  <div className="max-h-[50vh] space-y-1 overflow-y-auto">
                    {searchResults.products.map((item, i) => (
                      <button
                        key={`product-${i}`}
                        className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-muted"
                        onClick={() => handleSelect(item)}
                      >
                        {item.thumbnail_url && (
                          <img src={item.thumbnail_url} alt="" className="h-8 w-8 rounded object-cover" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">{item.food_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.brand_name && `${item.brand_name} · `}
                            {item.calories} kcal per {item.serving_qty}{item.serving_unit}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults && searchResults.products?.length === 0 && query.length >= 2 && !isSearching && (
                  <p className="py-4 text-center text-sm text-muted-foreground">No results found</p>
                )}
              </>
            ) : (
              <>
                {myRecipes && myRecipes.length > 0 ? (
                  <>
                    {myRecipes.length > 5 && (
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Filter recipes..."
                          value={recipeFilter}
                          onChange={(e) => setRecipeFilter(e.target.value)}
                          className="pl-9"
                          autoFocus
                        />
                      </div>
                    )}
                    <div className="max-h-[50vh] space-y-1 overflow-y-auto">
                      {(filteredRecipes ?? myRecipes).map((recipe: { id: string; name: string; mealPlanName: string; mealType: string | null; calories: number | null; proteinG: number | null; carbsG: number | null; fatG: number | null; servings: number | null; imageUrl: string | null }) => (
                        <button
                          key={recipe.id}
                          className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-muted"
                          onClick={() => handleSelectRecipe(recipe)}
                        >
                          {recipe.imageUrl && (
                            <img src={recipe.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm">{recipe.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {recipe.mealPlanName}
                              {recipe.calories != null && ` · ${recipe.calories} kcal`}
                              {recipe.servings && ` · ${recipe.servings} servings`}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No recipes assigned yet. Your trainer can assign meal plans with recipes.
                  </p>
                )}
              </>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border p-3">
              <div className="flex items-center gap-3">
                {selected.thumbnail_url && (
                  <img src={selected.thumbnail_url} alt="" className="h-12 w-12 rounded object-cover" />
                )}
                <div>
                  <p className="font-medium">{selected.food_name}</p>
                  {selected.brand_name && (
                    <p className="text-xs text-muted-foreground">{selected.brand_name}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {selected.serving_qty} {selected.serving_unit}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center text-sm">
                <div>
                  <p className="font-medium">{selected.calories}</p>
                  <p className="text-xs text-muted-foreground">kcal</p>
                </div>
                <div>
                  <p className="font-medium">{Math.round(selected.protein_g ?? 0)}g</p>
                  <p className="text-xs text-muted-foreground">Protein</p>
                </div>
                <div>
                  <p className="font-medium">{Math.round(selected.carbs_g ?? 0)}g</p>
                  <p className="text-xs text-muted-foreground">Carbs</p>
                </div>
                <div>
                  <p className="font-medium">{Math.round(selected.fat_g ?? 0)}g</p>
                  <p className="text-xs text-muted-foreground">Fat</p>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">Servings</label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                value={servingSize}
                onChange={(e) => setServingSize(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setSelected(null)}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleConfirm}>
                Add Food
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
