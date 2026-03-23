import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  wizardServicesSchema,
  type WizardServicesInput,
  TRAINER_SERVICES,
  TRAINER_QUALIFICATIONS,
} from '@fitnassist/schemas';
import { Button, MultiSelect } from '@/components/ui';
import type { WizardStepProps } from '../../ProfileWizard/ProfileWizard.types';

export function ServicesStep({
  data,
  onUpdate,
  onNext,
  onBack,
}: WizardStepProps) {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<WizardServicesInput>({
    resolver: zodResolver(wizardServicesSchema),
    defaultValues: data.services,
  });

  const onSubmit = (formData: WizardServicesInput) => {
    onUpdate('services', formData);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-6">
        <Controller
          name="services"
          control={control}
          render={({ field }) => (
            <MultiSelect
              label="Services & Specializations"
              options={TRAINER_SERVICES}
              value={field.value}
              onChange={field.onChange}
              groupByCategory
              error={errors.services?.message}
            />
          )}
        />

        <Controller
          name="qualifications"
          control={control}
          render={({ field }) => (
            <MultiSelect
              label="Qualifications & Certifications"
              options={TRAINER_QUALIFICATIONS.map((q) => ({
                ...q,
                category: q.region === 'uk' ? 'UK Qualifications' : 'International',
              }))}
              value={field.value}
              onChange={field.onChange}
              groupByCategory
              error={errors.qualifications?.message}
            />
          )}
        />
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">
          Continue
        </Button>
      </div>
    </form>
  );
}
