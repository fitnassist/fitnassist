import { Link } from 'react-router-dom';
import { Pencil, Trash2, UtensilsCrossed, Clock, Flame, Users } from 'lucide-react';
import { Card, CardContent, Button } from '@/components/ui';
import { routes } from '@/config/routes';

interface RecipeCardProps {
  recipe: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    calories: number | null;
    proteinG: number | null;
    carbsG: number | null;
    fatG: number | null;
    prepTimeMin: number | null;
    cookTimeMin: number | null;
    servings: number | null;
    tags: string[];
  };
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export const RecipeCard = ({ recipe, onDelete, isDeleting }: RecipeCardProps) => {
  const totalTime = (recipe.prepTimeMin ?? 0) + (recipe.cookTimeMin ?? 0);

  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Image / Placeholder */}
          <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
            {recipe.imageUrl ? (
              <img
                src={recipe.imageUrl}
                alt={recipe.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <UtensilsCrossed className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-medium truncate">{recipe.name}</h3>
                {recipe.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                    {recipe.description}
                  </p>
                )}

                {/* Meta info */}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  {recipe.calories && (
                    <span className="flex items-center gap-1">
                      <Flame className="h-3 w-3" />
                      {recipe.calories} kcal
                    </span>
                  )}
                  {totalTime > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {totalTime} min
                    </span>
                  )}
                  {recipe.servings && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {recipe.servings} serving{recipe.servings > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Macros */}
                {(recipe.proteinG || recipe.carbsG || recipe.fatG) && (
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    {recipe.proteinG != null && (
                      <span className="text-blue-600">P: {recipe.proteinG}g</span>
                    )}
                    {recipe.carbsG != null && (
                      <span className="text-amber-600">C: {recipe.carbsG}g</span>
                    )}
                    {recipe.fatG != null && (
                      <span className="text-red-600">F: {recipe.fatG}g</span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Link to={routes.dashboardRecipeEdit(recipe.id)}>
                  <Button variant="ghost" size="sm">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(recipe.id)}
                  disabled={isDeleting}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Tags */}
            {recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {recipe.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground"
                  >
                    {tag}
                  </span>
                ))}
                {recipe.tags.length > 4 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                    +{recipe.tags.length - 4} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
