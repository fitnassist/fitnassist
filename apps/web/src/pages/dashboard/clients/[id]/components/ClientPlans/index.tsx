import { ClipboardList, Salad } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  type SelectOption,
} from '@/components/ui';
import {
  useAssignWorkoutPlan,
  useUnassignWorkoutPlan,
  useAssignMealPlan,
  useUnassignMealPlan,
} from '@/api/client-roster';
import { useWorkoutPlans } from '@/api/workout-plan';
import { useMealPlans } from '@/api/meal-plan';

interface PlanAssignment {
  id: string;
  assignedAt: Date;
  workoutPlan?: {
    id: string;
    name: string;
  };
  mealPlan?: {
    id: string;
    name: string;
  };
}

interface ClientPlansProps {
  clientId: string;
  workoutPlanAssignments: PlanAssignment[];
  mealPlanAssignments: PlanAssignment[];
  isDisconnected?: boolean;
}

export const ClientPlans = ({
  clientId,
  workoutPlanAssignments,
  mealPlanAssignments,
  isDisconnected,
}: ClientPlansProps) => {
  const assignWorkout = useAssignWorkoutPlan();
  const unassignWorkout = useUnassignWorkoutPlan();
  const assignMeal = useAssignMealPlan();
  const unassignMeal = useUnassignMealPlan();

  const { data: workoutPlanData } = useWorkoutPlans({ limit: 50 });
  const { data: mealPlanData } = useMealPlans({ limit: 50 });

  const workoutPlanOptions: SelectOption[] = (workoutPlanData?.plans ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const mealPlanOptions: SelectOption[] = (mealPlanData?.plans ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const selectedWorkoutPlans: SelectOption[] = workoutPlanAssignments
    .filter((a) => a.workoutPlan)
    .map((a) => ({ value: a.workoutPlan!.id, label: a.workoutPlan!.name }));

  const selectedMealPlans: SelectOption[] = mealPlanAssignments
    .filter((a) => a.mealPlan)
    .map((a) => ({ value: a.mealPlan!.id, label: a.mealPlan!.name }));

  const currentWorkoutIds = new Set(selectedWorkoutPlans.map((o) => o.value));
  const currentMealIds = new Set(selectedMealPlans.map((o) => o.value));

  const handleWorkoutChange = (options: readonly SelectOption[]) => {
    const newIds = new Set(options.map((o) => o.value));
    for (const opt of options) {
      if (!currentWorkoutIds.has(opt.value)) {
        assignWorkout.mutate({
          clientRosterId: clientId,
          workoutPlanId: opt.value,
          planName: opt.label,
        });
      }
    }
    for (const id of currentWorkoutIds) {
      if (!newIds.has(id)) {
        unassignWorkout.mutate({ clientRosterId: clientId, workoutPlanId: id });
      }
    }
  };

  const handleMealChange = (options: readonly SelectOption[]) => {
    const newIds = new Set(options.map((o) => o.value));
    for (const opt of options) {
      if (!currentMealIds.has(opt.value)) {
        assignMeal.mutate({ clientRosterId: clientId, mealPlanId: opt.value, planName: opt.label });
      }
    }
    for (const id of currentMealIds) {
      if (!newIds.has(id)) {
        unassignMeal.mutate({ clientRosterId: clientId, mealPlanId: id });
      }
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Workout Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <label htmlFor="client-workout-plans" className="sr-only">
            Workout plans
          </label>
          <Select
            inputId="client-workout-plans"
            isMulti
            options={workoutPlanOptions}
            value={selectedWorkoutPlans}
            onChange={handleWorkoutChange}
            placeholder="Select workout plans..."
            isDisabled={isDisconnected}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Salad className="h-4 w-4" />
            Meal Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <label htmlFor="client-meal-plans" className="sr-only">
            Meal plans
          </label>
          <Select
            inputId="client-meal-plans"
            isMulti
            options={mealPlanOptions}
            value={selectedMealPlans}
            onChange={handleMealChange}
            placeholder="Select meal plans..."
            isDisabled={isDisconnected}
          />
        </CardContent>
      </Card>
    </div>
  );
};
