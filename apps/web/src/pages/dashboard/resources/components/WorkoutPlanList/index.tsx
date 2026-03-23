import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ClipboardList, Search } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useWorkoutPlans, useDeleteWorkoutPlan } from '@/api/workout-plan';
import { routes } from '@/config/routes';
import { WorkoutPlanCard } from '../WorkoutPlanCard';

export const WorkoutPlanList = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useWorkoutPlans({ search: search || undefined, page });
  const deletePlan = useDeleteWorkoutPlan();

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this workout plan?')) {
      deletePlan.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse h-20 bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workout plans..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Link to={routes.dashboardWorkoutPlanCreate}>
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            New Workout Plan
          </Button>
        </Link>
      </div>

      {!data || data.plans.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">No workout plans yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create a workout plan by combining exercises from your library.
          </p>
          <Link to={routes.dashboardWorkoutPlanCreate}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Workout Plan
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data.plans.map((plan) => (
              <WorkoutPlanCard
                key={plan.id}
                plan={plan}
                onDelete={handleDelete}
                isDeleting={deletePlan.isPending}
              />
            ))}
          </div>

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
