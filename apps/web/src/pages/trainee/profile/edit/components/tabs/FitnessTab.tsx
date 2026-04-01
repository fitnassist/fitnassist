import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  updateTraineeProfileSchema,
  FITNESS_GOALS,
  EXPERIENCE_LEVEL_OPTIONS,
  ACTIVITY_LEVEL_OPTIONS,
} from '@fitnassist/schemas';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Textarea,
  Select,
  type SelectOption,
} from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { toast } from '@/lib/toast';

const experienceOptions = EXPERIENCE_LEVEL_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
const activityOptions = ACTIVITY_LEVEL_OPTIONS.map((o) => ({ value: o.value, label: o.label }));

const fitnessSchema = updateTraineeProfileSchema.pick({
  experienceLevel: true,
  activityLevel: true,
  fitnessGoals: true,
  fitnessGoalNotes: true,
  medicalNotes: true,
});

type FitnessInput = z.infer<typeof fitnessSchema>;

interface FitnessTabProps {
  profile: {
    experienceLevel: string | null;
    activityLevel: string | null;
    fitnessGoals: string[];
    fitnessGoalNotes: string | null;
    medicalNotes: string | null;
  } | null;
}

export const FitnessTab = ({ profile }: FitnessTabProps) => {
  const [isSaving, setIsSaving] = useState(false);

  const utils = trpc.useUtils();
  const createMutation = trpc.trainee.create.useMutation({
    onSuccess: () => {
      utils.trainee.getMyProfile.invalidate();
      utils.trainee.hasProfile.invalidate();
      toast.success('Profile created');
    },
  });
  const updateMutation = trpc.trainee.update.useMutation({
    onSuccess: () => {
      utils.trainee.getMyProfile.invalidate();
      toast.success('Fitness info updated');
    },
  });

  const mutation = profile ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isDirty },
  } = useForm<FitnessInput>({
    resolver: zodResolver(fitnessSchema),
    defaultValues: {
      experienceLevel: (profile?.experienceLevel as FitnessInput['experienceLevel']) || undefined,
      activityLevel: (profile?.activityLevel as FitnessInput['activityLevel']) || undefined,
      fitnessGoals: profile?.fitnessGoals || [],
      fitnessGoalNotes: profile?.fitnessGoalNotes || '',
      medicalNotes: profile?.medicalNotes || '',
    },
  });

  const fitnessGoals = watch('fitnessGoals');

  const toggleGoal = (value: string) => {
    const current = fitnessGoals || [];
    const updated = current.includes(value)
      ? current.filter((g) => g !== value)
      : [...current, value];
    setValue('fitnessGoals', updated, { shouldDirty: true });
  };

  const onSubmit = async (data: FitnessInput) => {
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
        <CardTitle>Fitness Information</CardTitle>
        <CardDescription>Update your experience level, activity level, and goals.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="edit-experience-level">Experience Level</Label>
              <Controller
                name="experienceLevel"
                control={control}
                render={({ field }) => (
                  <Select
                    inputId="edit-experience-level"
                    options={experienceOptions}
                    value={experienceOptions.find((o) => o.value === field.value) || null}
                    onChange={(opt: SelectOption | null) => field.onChange(opt?.value || undefined)}
                    placeholder="Select..."
                    isClearable
                  />
                )}
              />
            </div>

            <div>
              <Label htmlFor="edit-activity-level">Activity Level</Label>
              <Controller
                name="activityLevel"
                control={control}
                render={({ field }) => (
                  <Select
                    inputId="edit-activity-level"
                    options={activityOptions}
                    value={activityOptions.find((o) => o.value === field.value) || null}
                    onChange={(opt: SelectOption | null) => field.onChange(opt?.value || undefined)}
                    placeholder="Select..."
                    isClearable
                  />
                )}
              />
            </div>
          </div>

          <div>
            <Label>Fitness Goals</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {FITNESS_GOALS.map((goal) => (
                <button
                  key={goal.value}
                  type="button"
                  onClick={() => toggleGoal(goal.value)}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                    fitnessGoals?.includes(goal.value)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-input hover:bg-muted/50'
                  }`}
                >
                  {goal.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="fitnessGoalNotes">Goal Notes</Label>
            <Textarea
              id="fitnessGoalNotes"
              placeholder="Any specific goals or targets you're working towards..."
              {...register('fitnessGoalNotes')}
              rows={3}
            />
            {errors.fitnessGoalNotes && (
              <p className="text-sm text-destructive">{errors.fitnessGoalNotes.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="medicalNotes">Medical Notes</Label>
            <Textarea
              id="medicalNotes"
              placeholder="Any injuries, conditions, or medical information trainers should know about..."
              {...register('medicalNotes')}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This information is only shared with your connected trainers.
            </p>
            {errors.medicalNotes && (
              <p className="text-sm text-destructive">{errors.medicalNotes.message}</p>
            )}
          </div>

          {mutation.error && <p className="text-sm text-destructive">{mutation.error.message}</p>}

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
