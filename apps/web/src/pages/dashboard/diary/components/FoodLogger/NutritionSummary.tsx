import { useDailyNutrition } from '@/api/diary';
import { trpc } from '@/lib/trpc';

interface NutritionSummaryProps {
  date: string;
  calorieTarget?: number | null;
}

export const NutritionSummary = ({ date }: NutritionSummaryProps) => {
  const { data: nutrition } = useDailyNutrition(date);
  const { data: targets } = trpc.trainee.getNutritionTargets.useQuery();

  if (!nutrition) return null;

  const effective = targets?.effective;
  const calTarget = effective?.calories ?? 2000;
  const proteinTarget = effective?.proteinG ?? 0;
  const carbsTarget = effective?.carbsG ?? 0;
  const fatTarget = effective?.fatG ?? 0;

  const caloriesBurned = nutrition.caloriesBurned ?? 0;
  const netCalories = nutrition.totalCalories - caloriesBurned;
  const percentage = Math.min(Math.round((netCalories / calTarget) * 100), 100);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-semibold">{nutrition.totalCalories}</span>
        <span className="text-sm text-muted-foreground">/ {calTarget} kcal</span>
      </div>
      {caloriesBurned > 0 && (
        <p className="text-xs text-muted-foreground">
          Net: {netCalories} kcal ({caloriesBurned} burned)
        </p>
      )}
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-orange-500 transition-all"
          style={{ width: `${Math.max(percentage, 0)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          P: {Math.round(nutrition.totalProtein)}g{proteinTarget > 0 && ` / ${proteinTarget}g`}
        </span>
        <span>
          C: {Math.round(nutrition.totalCarbs)}g{carbsTarget > 0 && ` / ${carbsTarget}g`}
        </span>
        <span>
          F: {Math.round(nutrition.totalFat)}g{fatTarget > 0 && ` / ${fatTarget}g`}
        </span>
      </div>
    </div>
  );
};
