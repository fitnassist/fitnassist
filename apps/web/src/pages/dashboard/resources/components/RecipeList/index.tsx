import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, UtensilsCrossed, Search } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useRecipes, useDeleteRecipe } from '@/api/recipe';
import { routes } from '@/config/routes';
import { RecipeCard } from '../RecipeCard';

export const RecipeList = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useRecipes({ search: search || undefined, page });
  const deleteRecipe = useDeleteRecipe();

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      deleteRecipe.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse h-24 bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search + Create */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Link to={routes.dashboardRecipeCreate}>
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            New Recipe
          </Button>
        </Link>
      </div>

      {/* List */}
      {!data || data.recipes.length === 0 ? (
        <div className="text-center py-12">
          <UtensilsCrossed className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">No recipes yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first recipe to start building meal plans.
          </p>
          <Link to={routes.dashboardRecipeCreate}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Recipe
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data.recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onDelete={handleDelete}
                isDeleting={deleteRecipe.isPending}
              />
            ))}
          </div>

          {/* Pagination */}
          {(data.hasMore || page > 1) && (
            <div className="flex justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="flex items-center text-sm text-muted-foreground px-2">
                Page {page}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={!data.hasMore}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
