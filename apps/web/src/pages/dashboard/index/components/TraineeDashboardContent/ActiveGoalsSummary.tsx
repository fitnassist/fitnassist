import { Link } from 'react-router-dom';
import { Target, Repeat, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
import { useGoals } from '@/api/goal';
import { routes } from '@/config/routes';

export const ActiveGoalsSummary = () => {
  const { data: goals } = useGoals('ACTIVE');

  const activeGoals = goals ?? [];

  if (activeGoals.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Goals</CardTitle>
            <Link to={routes.dashboardGoals}>
              <Button variant="ghost" size="sm" className="text-xs">
                Set a goal
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground py-2">
            No active goals. Set one to start tracking progress.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Link to={routes.dashboardGoals} className="block">
      <Card className="transition-colors hover:bg-muted/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Goals
              <Badge variant="info" className="ml-2">
                {activeGoals.length}
              </Badge>
            </CardTitle>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeGoals.slice(0, 3).map((goal) => {
              const isTarget = goal.type === 'TARGET';

              const progress = isTarget
                ? (goal.targetValue && goal.currentValue != null
                    ? Math.min(Math.max((goal.currentValue / goal.targetValue) * 100, 0), 100)
                    : 0)
                : (goal.frequencyPerWeek
                    ? Math.min(((goal.weeklyProgress ?? 0) / goal.frequencyPerWeek) * 100, 100)
                    : 0);

              return (
                <div key={goal.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isTarget
                        ? <Target className="h-3.5 w-3.5 text-blue-500" />
                        : <Repeat className="h-3.5 w-3.5 text-purple-500" />}
                      <span className="text-sm">{goal.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${isTarget ? 'bg-blue-500' : 'bg-purple-500'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {activeGoals.length > 3 && (
              <p className="text-center text-xs text-muted-foreground">
                +{activeGoals.length - 3} more
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
