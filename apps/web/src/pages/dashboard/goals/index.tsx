import { Target } from 'lucide-react';
import { PageLayout } from '@/components/layouts';
import { useGoals } from '@/api/goal';
import { GoalCard } from './components/GoalCard';
import { CreateGoalDialog } from './components/CreateGoalDialog';
import { EmptyGoals } from './components/EmptyGoals';

export const GoalsPage = () => {
  const { data: goals, isLoading } = useGoals();

  const activeGoals = goals?.filter((g) => g.status === 'ACTIVE') ?? [];
  const completedGoals = goals?.filter((g) => g.status === 'COMPLETED') ?? [];
  const abandonedGoals = goals?.filter((g) => g.status === 'ABANDONED') ?? [];

  return (
    <PageLayout>
      <PageLayout.Header
        title="Goals"
        icon={<Target className="h-6 w-6 sm:h-8 sm:w-8" />}
        action={<CreateGoalDialog />}
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : activeGoals.length === 0 && completedGoals.length === 0 && abandonedGoals.length === 0 ? (
        <EmptyGoals />
      ) : (
        <div className="space-y-6">
          {/* Active Goals */}
          {activeGoals.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                Active ({activeGoals.length})
              </h2>
              <div className="space-y-3">
                {activeGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            </section>
          )}

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                Completed ({completedGoals.length})
              </h2>
              <div className="space-y-3">
                {completedGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            </section>
          )}

          {/* Abandoned Goals */}
          {abandonedGoals.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                Abandoned ({abandonedGoals.length})
              </h2>
              <div className="space-y-3">
                {abandonedGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </PageLayout>
  );
};

export default GoalsPage;
