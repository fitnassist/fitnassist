import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Textarea, Label, Select } from '@/components/ui';
import { useCreateGoal } from '@/api/goal';
import { createGoalSchema, type CreateGoalInput } from '@fitnassist/schemas';
import {
  ENTRY_TYPE_OPTIONS,
  ENTRY_FIELD_OPTIONS,
  TARGET_UNIT_MAP,
  HABIT_ENTRY_TYPE_OPTIONS,
} from '@/pages/dashboard/goals/components/goals.constants';

interface CreateGoalFormProps {
  clientRosterId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const CreateGoalForm = ({ clientRosterId, onSuccess, onCancel }: CreateGoalFormProps) => {
  const createGoal = useCreateGoal();

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<CreateGoalInput>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: {
      type: 'TARGET',
      entryType: 'WEIGHT',
      entryField: 'weightKg',
      targetUnit: 'kg',
      ...(clientRosterId ? { clientRosterId } : {}),
    },
  });

  const goalType = watch('type');
  const entryType = watch('entryType');
  const entryField = watch('entryField');

  const fieldOptions = entryType ? ENTRY_FIELD_OPTIONS[entryType] : undefined;

  // Auto-set entryField and targetUnit when entryType changes
  useEffect(() => {
    if (goalType !== 'TARGET' || !entryType) return;

    const fields = ENTRY_FIELD_OPTIONS[entryType];
    const firstField = fields?.[0];
    if (firstField) {
      setValue('entryField', firstField.value);
      setValue('targetUnit', TARGET_UNIT_MAP[firstField.value] || 'units');
    }
  }, [entryType, goalType, setValue]);

  // Update targetUnit when entryField changes
  useEffect(() => {
    if (goalType !== 'TARGET' || !entryField) return;
    setValue('targetUnit', TARGET_UNIT_MAP[entryField] || 'units');
  }, [entryField, goalType, setValue]);

  const onSubmit = (data: CreateGoalInput) => {
    createGoal.mutate(data, {
      onSuccess: () => onSuccess(),
    });
  };

  const targetEntryOptions = ENTRY_TYPE_OPTIONS.filter(
    (o) => o.value === 'WEIGHT' || o.value === 'MEASUREMENT',
  ).map((o) => ({ value: o.value, label: o.label }));

  const habitOptions = HABIT_ENTRY_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Type toggle */}
      <div>
        <Label>Type</Label>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <div className="mt-1.5 flex gap-2">
              <Button
                type="button"
                variant={field.value === 'TARGET' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => field.onChange('TARGET')}
              >
                Target
              </Button>
              <Button
                type="button"
                variant={field.value === 'HABIT' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => field.onChange('HABIT')}
              >
                Habit
              </Button>
            </div>
          )}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {goalType === 'TARGET'
            ? 'Reach a specific value (e.g., weigh 75kg)'
            : 'Do something regularly (e.g., log water 5x/week)'}
        </p>
      </div>

      {/* Goal Name */}
      <div>
        <Label>Goal Name</Label>
        <Input
          {...register('name')}
          className="mt-1.5"
          placeholder={goalType === 'TARGET' ? 'e.g., Reach 75kg' : 'e.g., Drink water daily'}
        />
        {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
      </div>

      {/* Description */}
      <div>
        <Label>Description (optional)</Label>
        <Textarea
          {...register('description')}
          className="mt-1.5"
          placeholder="Why is this goal important to you?"
          rows={2}
        />
      </div>

      {/* TARGET fields */}
      {goalType === 'TARGET' && (
        <>
          <div>
            <Label htmlFor="goal-track-via">Track via</Label>
            <Controller
              name="entryType"
              control={control}
              render={({ field }) => (
                <Select
                  inputId="goal-track-via"
                  className="mt-1.5"
                  value={targetEntryOptions.find((o) => o.value === field.value) ?? null}
                  onChange={(opt) => {
                    if (opt) field.onChange(opt.value);
                  }}
                  options={targetEntryOptions}
                />
              )}
            />
          </div>

          {fieldOptions && fieldOptions.length > 1 && (
            <div>
              <Label htmlFor="goal-measurement">Measurement</Label>
              <Controller
                name="entryField"
                control={control}
                render={({ field }) => (
                  <Select
                    inputId="goal-measurement"
                    className="mt-1.5"
                    value={fieldOptions.find((o) => o.value === field.value) ?? null}
                    onChange={(opt) => {
                      if (opt) field.onChange(opt.value);
                    }}
                    options={fieldOptions.map((o) => ({ value: o.value, label: o.label }))}
                  />
                )}
              />
            </div>
          )}

          <div>
            <Label>Target Value ({TARGET_UNIT_MAP[entryField ?? ''] || 'units'})</Label>
            <Input
              {...register('targetValue', { valueAsNumber: true })}
              className="mt-1.5"
              type="number"
              step="0.1"
              placeholder="e.g., 75"
            />
            {errors.targetValue && (
              <p className="mt-1 text-xs text-destructive">{errors.targetValue.message}</p>
            )}
          </div>
        </>
      )}

      {/* HABIT fields */}
      {goalType === 'HABIT' && (
        <>
          <div>
            <Label htmlFor="goal-habit-entry-type">What counts as doing it?</Label>
            <Controller
              name="habitEntryType"
              control={control}
              render={({ field }) => (
                <Select
                  inputId="goal-habit-entry-type"
                  className="mt-1.5"
                  value={habitOptions.find((o) => o.value === field.value) ?? null}
                  onChange={(opt) => {
                    if (opt) field.onChange(opt.value);
                  }}
                  options={habitOptions}
                />
              )}
            />
          </div>

          <div>
            <Label>Times per week</Label>
            <Input
              {...register('frequencyPerWeek', { valueAsNumber: true })}
              className="mt-1.5"
              type="number"
              min="1"
              max="7"
              placeholder="e.g., 5"
            />
            {errors.frequencyPerWeek && (
              <p className="mt-1 text-xs text-destructive">{errors.frequencyPerWeek.message}</p>
            )}
          </div>
        </>
      )}

      {/* Deadline */}
      <div>
        <Label>Deadline (optional)</Label>
        <Input {...register('deadline')} className="mt-1.5" type="date" />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={createGoal.isPending}>
          {createGoal.isPending ? 'Creating...' : 'Create Goal'}
        </Button>
      </div>

      {createGoal.isError && (
        <p className="text-xs text-destructive">
          {createGoal.error?.message ?? 'Failed to create goal'}
        </p>
      )}
    </form>
  );
};
