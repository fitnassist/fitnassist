import { useState } from 'react';
import { Target, Repeat, Check, X, MoreHorizontal, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  Button,
  Badge,
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui';
import { useCompleteGoal, useAbandonGoal } from '@/api/goal';

interface GoalCardProps {
  goal: {
    id: string;
    name: string;
    description: string | null;
    type: 'TARGET' | 'HABIT';
    status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
    targetValue: number | null;
    targetUnit: string | null;
    currentValue: number | null;
    frequencyPerWeek: number | null;
    habitEntryType: string | null;
    deadline: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    weeklyProgress?: number;
  };
}

const ENTRY_TYPE_LABELS: Record<string, string> = {
  WEIGHT: 'Weight',
  WATER: 'Water',
  FOOD: 'Food',
  MOOD: 'Mood',
  SLEEP: 'Sleep',
  MEASUREMENT: 'Measurements',
};

export const GoalCard = ({ goal }: GoalCardProps) => {
  const [showComplete, setShowComplete] = useState(false);
  const [showAbandon, setShowAbandon] = useState(false);
  const completeGoal = useCompleteGoal();
  const abandonGoal = useAbandonGoal();

  const isTarget = goal.type === 'TARGET';
  const isActive = goal.status === 'ACTIVE';

  const getTargetProgress = () => {
    if (!isTarget || goal.targetValue === null || goal.currentValue === null) return 0;
    return Math.min(Math.max((goal.currentValue / goal.targetValue) * 100, 0), 100);
  };

  const getHabitProgress = () => {
    if (goal.type !== 'HABIT' || !goal.frequencyPerWeek) return 0;
    return Math.min(((goal.weeklyProgress ?? 0) / goal.frequencyPerWeek) * 100, 100);
  };

  const progress = isTarget ? getTargetProgress() : getHabitProgress();

  const statusBadge = () => {
    switch (goal.status) {
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'ABANDONED':
        return <Badge variant="destructive">Abandoned</Badge>;
      default:
        return null;
    }
  };

  const deadlineInfo = () => {
    if (!goal.deadline) return null;
    const d = goal.deadline instanceof Date ? goal.deadline : new Date(goal.deadline);
    const now = new Date();
    const daysLeft = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let color = 'text-muted-foreground';
    let label = `${daysLeft}d left`;
    if (daysLeft < 0) { color = 'text-destructive'; label = 'Overdue'; }
    else if (daysLeft === 0) { color = 'text-amber-500'; label = 'Due today'; }
    else if (daysLeft <= 7) { color = 'text-amber-500'; }

    return (
      <span className={`flex items-center gap-1 text-xs ${color}`}>
        <Calendar className="h-3 w-3" />
        {label} ({format(d, 'd MMM yyyy')})
      </span>
    );
  };

  return (
    <Card className={goal.status !== 'ACTIVE' ? 'opacity-60' : undefined}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 shrink-0 rounded-md p-2 ${isTarget ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
              {isTarget ? <Target className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{goal.name}</p>
                <Badge variant="outline" className="text-xs">
                  {isTarget ? 'Target' : 'Habit'}
                </Badge>
                {statusBadge()}
              </div>
              {goal.description && (
                <p className="mt-1 text-sm text-muted-foreground">{goal.description}</p>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-3">
                {deadlineInfo()}
                {goal.completedAt && (
                  <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <Check className="h-3 w-3" />
                    Completed {format(goal.completedAt instanceof Date ? goal.completedAt : new Date(goal.completedAt), 'd MMM yyyy')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {isActive && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowComplete(true)}>
                  <Check className="mr-2 h-4 w-4" />
                  Mark Complete
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowAbandon(true)} className="text-destructive">
                  <X className="mr-2 h-4 w-4" />
                  Abandon
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Progress */}
        <div className="mt-4">
          {isTarget ? (
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {goal.currentValue !== null ? `${goal.currentValue} ${goal.targetUnit}` : 'No data yet'}
                </span>
                <span className="font-medium">{goal.targetValue} {goal.targetUnit}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-right text-xs text-muted-foreground">{Math.round(progress)}%</p>
            </div>
          ) : (
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {goal.weeklyProgress ?? 0} / {goal.frequencyPerWeek}x this week
                  {goal.habitEntryType && ` (${ENTRY_TYPE_LABELS[goal.habitEntryType] ?? goal.habitEntryType})`}
                </span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: goal.frequencyPerWeek ?? 0 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2.5 flex-1 rounded-full ${
                      i < (goal.weeklyProgress ?? 0) ? 'bg-purple-500' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <ConfirmDialog
          open={showComplete}
          onOpenChange={setShowComplete}
          title="Complete goal?"
          description={`Mark "${goal.name}" as completed?`}
          onConfirm={() => completeGoal.mutate({ id: goal.id })}
          isLoading={completeGoal.isPending}
        />
        <ConfirmDialog
          open={showAbandon}
          onOpenChange={setShowAbandon}
          title="Abandon goal?"
          description={`This will mark "${goal.name}" as abandoned. You can't undo this.`}
          onConfirm={() => abandonGoal.mutate({ id: goal.id })}
          isLoading={abandonGoal.isPending}
          variant="destructive"
        />
      </CardContent>
    </Card>
  );
};
