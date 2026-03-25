import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Pencil, Trash2, Salad, UtensilsCrossed, Users } from 'lucide-react';
import { Card, CardContent, Button } from '@/components/ui';
import { routes } from '@/config/routes';
import { BulkAssignDialog } from '../BulkAssignDialog';

interface MealPlanCardProps {
  plan: {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    _count: { recipes: number };
  };
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export const MealPlanCard = ({ plan, onDelete, isDeleting }: MealPlanCardProps) => {
  const [assignOpen, setAssignOpen] = useState(false);

  return (
    <>
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Salad className="h-6 w-6 sm:h-7 sm:w-7 text-green-600 dark:text-green-400" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    to={routes.dashboardMealPlanEdit(plan.id)}
                    className="font-medium truncate hover:underline block"
                  >
                    {plan.name}
                  </Link>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                      {plan.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <UtensilsCrossed className="h-3 w-3" />
                      {plan._count.recipes} recipe{plan._count.recipes !== 1 ? 's' : ''}
                    </span>
                    <span>
                      Updated {formatDistanceToNow(new Date(plan.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="outline" size="sm" onClick={() => setAssignOpen(true)}>
                    <Users className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Assign</span>
                  </Button>
                  <Link to={routes.dashboardMealPlanEdit(plan.id)}>
                    <Button variant="ghost" size="sm">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(plan.id)}
                    disabled={isDeleting}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <BulkAssignDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        planType="meal"
        planId={plan.id}
        planName={plan.name}
      />
    </>
  );
};
