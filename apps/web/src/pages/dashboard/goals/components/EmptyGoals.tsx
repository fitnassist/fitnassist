import { Target } from 'lucide-react';

export const EmptyGoals = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-4">
        <Target className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-medium">No goals yet</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Set a target to reach or a habit to build. Goals help you stay on track and measure your
        progress over time.
      </p>
    </div>
  );
};
