import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateTraineeProfileSchema, WEEKLY_WEIGHT_GOAL_OPTIONS } from '@fitnassist/schemas';
import { calculateNutritionTargets } from '@fitnassist/utils';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Switch,
} from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { toast } from '@/lib/toast';

const nutritionSchema = updateTraineeProfileSchema.pick({
  weeklyWeightGoalKg: true,
  dailyCalorieTarget: true,
  dailyProteinTargetG: true,
  dailyCarbsTargetG: true,
  dailyFatTargetG: true,
  dailyWaterTargetMl: true,
});

type NutritionInput = z.infer<typeof nutritionSchema>;

interface NutritionTabProps {
  profile: {
    startWeightKg: number | null;
    heightCm: number | null;
    dateOfBirth: string | Date | null;
    gender: string | null;
    activityLevel: string | null;
    weeklyWeightGoalKg: number | null;
    dailyCalorieTarget: number | null;
    dailyProteinTargetG: number | null;
    dailyCarbsTargetG: number | null;
    dailyFatTargetG: number | null;
    dailyWaterTargetMl: number | null;
  } | null;
}

export const NutritionTab = ({ profile }: NutritionTabProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [useManualOverride, setUseManualOverride] = useState(profile?.dailyCalorieTarget != null);

  const utils = trpc.useUtils();
  const updateMutation = trpc.trainee.update.useMutation({
    onSuccess: () => {
      utils.trainee.getMyProfile.invalidate();
      utils.trainee.getNutritionTargets.invalidate();
      toast.success('Nutrition targets updated');
    },
  });

  const calculated = profile
    ? calculateNutritionTargets({
        ...profile,
        currentWeightKg: profile.startWeightKg,
      })
    : null;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<NutritionInput>({
    resolver: zodResolver(nutritionSchema),
    defaultValues: {
      weeklyWeightGoalKg: profile?.weeklyWeightGoalKg ?? undefined,
      dailyCalorieTarget: profile?.dailyCalorieTarget ?? undefined,
      dailyProteinTargetG: profile?.dailyProteinTargetG ?? undefined,
      dailyCarbsTargetG: profile?.dailyCarbsTargetG ?? undefined,
      dailyFatTargetG: profile?.dailyFatTargetG ?? undefined,
      dailyWaterTargetMl: profile?.dailyWaterTargetMl ?? undefined,
    },
  });

  const weeklyGoal = watch('weeklyWeightGoalKg');

  // Recalculate preview when weekly goal changes
  const previewCalc = profile
    ? calculateNutritionTargets({
        ...profile,
        currentWeightKg: profile.startWeightKg,
        weeklyWeightGoalKg: weeklyGoal ?? profile.weeklyWeightGoalKg,
      })
    : null;

  const effectiveCalc = previewCalc ?? calculated;

  // When switching off manual override, clear the manual fields
  useEffect(() => {
    if (!useManualOverride) {
      setValue('dailyCalorieTarget', undefined, { shouldDirty: true });
      setValue('dailyProteinTargetG', undefined, { shouldDirty: true });
      setValue('dailyCarbsTargetG', undefined, { shouldDirty: true });
      setValue('dailyFatTargetG', undefined, { shouldDirty: true });
    }
  }, [useManualOverride, setValue]);

  const onSubmit = async (data: NutritionInput) => {
    setIsSaving(true);
    try {
      const payload: NutritionInput = {
        weeklyWeightGoalKg: data.weeklyWeightGoalKg,
        dailyWaterTargetMl: data.dailyWaterTargetMl,
      };

      if (useManualOverride) {
        payload.dailyCalorieTarget = data.dailyCalorieTarget;
        payload.dailyProteinTargetG = data.dailyProteinTargetG;
        payload.dailyCarbsTargetG = data.dailyCarbsTargetG;
        payload.dailyFatTargetG = data.dailyFatTargetG;
      }

      await updateMutation.mutateAsync(payload);
    } finally {
      setIsSaving(false);
    }
  };

  const missingFields =
    !profile?.startWeightKg ||
    !profile?.heightCm ||
    !profile?.dateOfBirth ||
    !profile?.gender ||
    !profile?.activityLevel;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nutrition Targets</CardTitle>
        <CardDescription>
          Set your weekly weight goal and daily nutrition targets. Targets are auto-calculated from
          your profile, or you can set them manually.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Weekly weight goal */}
          <div>
            <Label>Weekly Weight Goal</Label>
            <select
              className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...register('weeklyWeightGoalKg', { valueAsNumber: true })}
              defaultValue={profile?.weeklyWeightGoalKg ?? 0}
            >
              {WEEKLY_WEIGHT_GOAL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.weeklyWeightGoalKg && (
              <p className="mt-1 text-sm text-destructive">{errors.weeklyWeightGoalKg.message}</p>
            )}
          </div>

          {/* Auto-calculated targets display */}
          {missingFields ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              To auto-calculate your targets, fill in your weight, height, date of birth, gender,
              and activity level in the Metrics and Personal tabs.
            </div>
          ) : effectiveCalc ? (
            <div className="rounded-md bg-muted/50 p-4">
              <p className="text-sm font-medium">Calculated Daily Targets</p>
              <div className="mt-2 grid grid-cols-4 gap-3 text-center">
                <div>
                  <p className="text-lg font-semibold">{effectiveCalc.calories}</p>
                  <p className="text-xs text-muted-foreground">kcal</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">{effectiveCalc.proteinG}g</p>
                  <p className="text-xs text-muted-foreground">Protein</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">{effectiveCalc.carbsG}g</p>
                  <p className="text-xs text-muted-foreground">Carbs</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">{effectiveCalc.fatG}g</p>
                  <p className="text-xs text-muted-foreground">Fat</p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Manual override toggle */}
          <div className="flex items-center gap-3">
            <Switch checked={useManualOverride} onCheckedChange={setUseManualOverride} />
            <Label className="mb-0">Set custom targets manually</Label>
          </div>

          {/* Manual override fields */}
          {useManualOverride && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Daily Calories (kcal)</Label>
                <Input
                  type="number"
                  placeholder={effectiveCalc ? String(effectiveCalc.calories) : '2000'}
                  {...register('dailyCalorieTarget', { valueAsNumber: true })}
                />
                {errors.dailyCalorieTarget && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.dailyCalorieTarget.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Protein (g)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder={effectiveCalc ? String(effectiveCalc.proteinG) : '150'}
                  {...register('dailyProteinTargetG', { valueAsNumber: true })}
                />
                {errors.dailyProteinTargetG && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.dailyProteinTargetG.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Carbs (g)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder={effectiveCalc ? String(effectiveCalc.carbsG) : '200'}
                  {...register('dailyCarbsTargetG', { valueAsNumber: true })}
                />
                {errors.dailyCarbsTargetG && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.dailyCarbsTargetG.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Fat (g)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder={effectiveCalc ? String(effectiveCalc.fatG) : '65'}
                  {...register('dailyFatTargetG', { valueAsNumber: true })}
                />
                {errors.dailyFatTargetG && (
                  <p className="mt-1 text-sm text-destructive">{errors.dailyFatTargetG.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Water target */}
          <div className="max-w-xs">
            <Label>Daily Water Target (ml)</Label>
            <Input
              type="number"
              step="100"
              placeholder="2500"
              {...register('dailyWaterTargetMl', { valueAsNumber: true })}
            />
            {errors.dailyWaterTargetMl && (
              <p className="mt-1 text-sm text-destructive">{errors.dailyWaterTargetMl.message}</p>
            )}
          </div>

          {updateMutation.error && (
            <p className="text-sm text-destructive">{updateMutation.error.message}</p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving || !isDirty}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
