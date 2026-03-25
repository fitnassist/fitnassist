import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateTraineeProfileSchema } from '@fitnassist/schemas';
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
import {
  cmToFeetInches,
  feetInchesToCm,
  kgToLbs,
  lbsToKg,
} from '@/lib/unitConversion';

const bodyMetricsSchema = updateTraineeProfileSchema.pick({
  heightCm: true,
  startWeightKg: true,
  goalWeightKg: true,
  unitPreference: true,
});

type BodyMetricsInput = z.infer<typeof bodyMetricsSchema>;

interface BodyMetricsTabProps {
  profile: {
    heightCm: number | null;
    startWeightKg: number | null;
    goalWeightKg: number | null;
    unitPreference: 'METRIC' | 'IMPERIAL';
  } | null;
}

export const BodyMetricsTab = ({ profile }: BodyMetricsTabProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [unitPref, setUnitPref] = useState(profile?.unitPreference ?? 'METRIC');

  // Compute initial imperial values
  const initialFeetInches = profile?.heightCm ? cmToFeetInches(profile.heightCm) : { feet: 0, inches: 0 };
  const [heightFeet, setHeightFeet] = useState(profile?.heightCm ? String(initialFeetInches.feet) : '');
  const [heightInches, setHeightInches] = useState(profile?.heightCm ? String(initialFeetInches.inches) : '');
  const [weightLbs, setWeightLbs] = useState(profile?.startWeightKg ? String(kgToLbs(profile.startWeightKg)) : '');
  const [goalWeightLbs, setGoalWeightLbs] = useState(profile?.goalWeightKg ? String(kgToLbs(profile.goalWeightKg)) : '');

  const utils = trpc.useUtils();
  const createMutation = trpc.trainee.create.useMutation({
    onSuccess: () => {
      utils.trainee.getMyProfile.invalidate();
      utils.trainee.hasProfile.invalidate();
      setSuccessMessage('Profile created successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });
  const updateMutation = trpc.trainee.update.useMutation({
    onSuccess: () => {
      utils.trainee.getMyProfile.invalidate();
      setSuccessMessage('Metrics updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const mutation = profile ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<BodyMetricsInput>({
    resolver: zodResolver(bodyMetricsSchema),
    defaultValues: {
      heightCm: profile?.heightCm ?? undefined,
      startWeightKg: profile?.startWeightKg ?? undefined,
      goalWeightKg: profile?.goalWeightKg ?? undefined,
      unitPreference: profile?.unitPreference ?? 'METRIC',
    },
  });

  const handleUnitToggle = (isImperial: boolean) => {
    const newUnit = isImperial ? 'IMPERIAL' : 'METRIC';
    setUnitPref(newUnit);
    setValue('unitPreference', newUnit, { shouldDirty: true });
  };

  const handleImperialHeightChange = (feet: string, inches: string) => {
    setHeightFeet(feet);
    setHeightInches(inches);
    const f = parseFloat(feet) || 0;
    const i = parseFloat(inches) || 0;
    if (f > 0 || i > 0) {
      setValue('heightCm', Math.round(feetInchesToCm(f, i) * 10) / 10, { shouldDirty: true });
    }
  };

  const handleImperialWeightChange = (lbs: string, field: 'startWeightKg' | 'goalWeightKg') => {
    if (field === 'startWeightKg') setWeightLbs(lbs);
    else setGoalWeightLbs(lbs);
    const val = parseFloat(lbs);
    if (!isNaN(val) && val > 0) {
      setValue(field, lbsToKg(val), { shouldDirty: true });
    }
  };

  const onSubmit = async (data: BodyMetricsInput) => {
    setIsSaving(true);
    try {
      await mutation.mutateAsync(data);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Body Metrics</CardTitle>
        <CardDescription>
          Update your measurements. All values are stored in metric internally.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center gap-3">
            <Label>Units</Label>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${unitPref === 'METRIC' ? 'font-medium' : 'text-muted-foreground'}`}>
                Metric
              </span>
              <Switch
                checked={unitPref === 'IMPERIAL'}
                onCheckedChange={handleUnitToggle}
              />
              <span className={`text-sm ${unitPref === 'IMPERIAL' ? 'font-medium' : 'text-muted-foreground'}`}>
                Imperial
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Height</Label>
              {unitPref === 'METRIC' ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="170"
                    {...register('heightCm', { valueAsNumber: true })}
                  />
                  <span className="text-sm text-muted-foreground">cm</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="5"
                    value={heightFeet}
                    onChange={(e) => handleImperialHeightChange(e.target.value, heightInches)}
                  />
                  <span className="text-sm text-muted-foreground">ft</span>
                  <Input
                    type="number"
                    placeholder="10"
                    value={heightInches}
                    onChange={(e) => handleImperialHeightChange(heightFeet, e.target.value)}
                  />
                  <span className="text-sm text-muted-foreground">in</span>
                </div>
              )}
              {errors.heightCm && (
                <p className="text-sm text-destructive">{errors.heightCm.message}</p>
              )}
            </div>

            <div>
              <Label>Start Weight</Label>
              {unitPref === 'METRIC' ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="75"
                    {...register('startWeightKg', { valueAsNumber: true })}
                  />
                  <span className="text-sm text-muted-foreground">kg</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="165"
                    value={weightLbs}
                    onChange={(e) => handleImperialWeightChange(e.target.value, 'startWeightKg')}
                  />
                  <span className="text-sm text-muted-foreground">lbs</span>
                </div>
              )}
              {errors.startWeightKg && (
                <p className="text-sm text-destructive">{errors.startWeightKg.message}</p>
              )}
            </div>

            <div>
              <Label>Goal Weight</Label>
              {unitPref === 'METRIC' ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="70"
                    {...register('goalWeightKg', { valueAsNumber: true })}
                  />
                  <span className="text-sm text-muted-foreground">kg</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="155"
                    value={goalWeightLbs}
                    onChange={(e) => handleImperialWeightChange(e.target.value, 'goalWeightKg')}
                  />
                  <span className="text-sm text-muted-foreground">lbs</span>
                </div>
              )}
              {errors.goalWeightKg && (
                <p className="text-sm text-destructive">{errors.goalWeightKg.message}</p>
              )}
            </div>
          </div>

          {mutation.error && (
            <p className="text-sm text-destructive">{mutation.error.message}</p>
          )}

          {successMessage && (
            <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>
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
