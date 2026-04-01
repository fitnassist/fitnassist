import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  wizardServicesSchema,
  type WizardServicesInput,
  TRAINER_SERVICES,
  TRAINER_QUALIFICATIONS,
} from '@fitnassist/schemas';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  MultiSelect,
} from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { toast } from '@/lib/toast';
import { useState } from 'react';

interface ServicesTabProps {
  profile: {
    services: string[];
    qualifications: string[];
  };
}

export function ServicesTab({ profile }: ServicesTabProps) {
  const [isSaving, setIsSaving] = useState(false);

  const utils = trpc.useUtils();
  const updateMutation = trpc.trainer.update.useMutation({
    onSuccess: () => {
      utils.trainer.getMyProfile.invalidate();
      toast.success('Services updated');
    },
  });

  const {
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<WizardServicesInput>({
    resolver: zodResolver(wizardServicesSchema),
    defaultValues: {
      services: profile.services || [],
      qualifications: profile.qualifications || [],
    },
  });

  const onSubmit = async (data: WizardServicesInput) => {
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync(data);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Services & Qualifications</CardTitle>
        <CardDescription>Update the services you offer and your qualifications.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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
}
