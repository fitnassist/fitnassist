import { Link } from 'react-router-dom';
import {
  Utensils,
  Droplets,
  Scale,
  Moon,
  SmilePlus,
  Dumbbell,
  Footprints,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { useDiaryEntries, useDailyNutrition } from '@/api/diary';
import { trpc } from '@/lib/trpc';
import { routes } from '@/config/routes';

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const TodaySummary = () => {
  const dateStr = today();
  const { data: entries } = useDiaryEntries(dateStr);
  const { data: nutrition } = useDailyNutrition(dateStr);
  const { data: targets } = trpc.trainee.getNutritionTargets.useQuery();

  const hasWeight = entries?.some((e) => e.type === 'WEIGHT');
  const hasWater = entries?.some((e) => e.type === 'WATER');
  const hasMood = entries?.some((e) => e.type === 'MOOD');
  const hasSleep = entries?.some((e) => e.type === 'SLEEP');
  const hasFood = entries?.some((e) => e.type === 'FOOD');
  const hasWorkout = entries?.some((e) => e.type === 'WORKOUT_LOG');
  const hasSteps = entries?.some((e) => e.type === 'STEPS');

  const caloriesConsumed = nutrition?.totalCalories ?? 0;
  const caloriesBurned = nutrition?.caloriesBurned ?? 0;
  const calorieTarget = targets?.effective?.calories ?? 0;
  const netCalories = caloriesConsumed - caloriesBurned;
  const calorieProgress =
    calorieTarget > 0 ? Math.min((netCalories / calorieTarget) * 100, 100) : 0;

  const trackers = [
    { key: 'food', icon: Utensils, label: 'Food', done: hasFood, color: 'text-orange-500' },
    { key: 'water', icon: Droplets, label: 'Water', done: hasWater, color: 'text-blue-500' },
    { key: 'weight', icon: Scale, label: 'Weight', done: hasWeight, color: 'text-emerald-500' },
    { key: 'mood', icon: SmilePlus, label: 'Mood', done: hasMood, color: 'text-amber-500' },
    { key: 'sleep', icon: Moon, label: 'Sleep', done: hasSleep, color: 'text-indigo-500' },
    {
      key: 'workout',
      icon: Dumbbell,
      label: 'Workout',
      done: hasWorkout,
      color: 'text-violet-500',
    },
    { key: 'steps', icon: Footprints, label: 'Steps', done: hasSteps, color: 'text-green-500' },
  ];

  return (
    <Link to={routes.dashboardDiary} className="block">
      <Card className="transition-colors hover:bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Today</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Calorie ring */}
          {calorieTarget > 0 && (
            <div className="mb-4 flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0">
                <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-muted"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-primary"
                    strokeDasharray={`${Math.max(calorieProgress, 0) * 0.942} 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-semibold">
                    {Math.round(Math.max(calorieProgress, 0))}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold">{caloriesConsumed}</p>
                <p className="text-xs text-muted-foreground">
                  of {calorieTarget} kcal
                  {caloriesBurned > 0 && ` (${caloriesBurned} burned)`}
                </p>
              </div>
              {nutrition && (
                <div className="ml-auto grid grid-cols-3 gap-3 text-center text-xs">
                  <div>
                    <p className="font-medium">{Math.round(nutrition.totalProtein)}g</p>
                    <p className="text-muted-foreground">Protein</p>
                  </div>
                  <div>
                    <p className="font-medium">{Math.round(nutrition.totalCarbs)}g</p>
                    <p className="text-muted-foreground">Carbs</p>
                  </div>
                  <div>
                    <p className="font-medium">{Math.round(nutrition.totalFat)}g</p>
                    <p className="text-muted-foreground">Fat</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tracker status dots */}
          <div className="flex gap-1.5">
            {trackers.map(({ key, icon: Icon, label, done, color }) => (
              <div
                key={key}
                className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-2 ${done ? 'bg-muted/50' : ''}`}
              >
                <div className="relative">
                  <Icon className={`h-4 w-4 ${done ? color : 'text-muted-foreground/40'}`} />
                  {done && (
                    <Check className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-green-500 p-0.5 text-white" />
                  )}
                </div>
                <span
                  className={`text-[10px] ${done ? 'text-foreground' : 'text-muted-foreground/50'}`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
