import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { wizardBasicInfoSchema, type WizardBasicInfoInput } from '@fitnassist/schemas';
import { Button, Input, Label } from '@/components/ui';
import type { WizardStepProps } from '../../ProfileWizard/ProfileWizard.types';

export function BasicInfoStep({ data, onUpdate, onNext }: WizardStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WizardBasicInfoInput>({
    resolver: zodResolver(wizardBasicInfoSchema),
    defaultValues: data.basicInfo,
  });

  const onSubmit = (formData: WizardBasicInfoInput) => {
    onUpdate('basicInfo', formData);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="handle">Profile URL</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">fitnassist.co/trainers/</span>
            <Input
              id="handle"
              placeholder="your-handle"
              {...register('handle')}
              className="flex-1"
            />
          </div>
          {errors.handle && <p className="text-sm text-destructive">{errors.handle.message}</p>}
          <p className="mt-1.5 text-xs text-muted-foreground">
            This will be your unique profile URL. Use lowercase letters, numbers, and hyphens only.
          </p>
        </div>

        <div>
          <Label htmlFor="displayName">Display Name</Label>
          <Input id="displayName" placeholder="John Smith" {...register('displayName')} />
          {errors.displayName && (
            <p className="text-sm text-destructive">{errors.displayName.message}</p>
          )}
          <p className="mt-1.5 text-xs text-muted-foreground">
            This is the name that will be displayed on your profile.
          </p>
        </div>

        <div>
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            placeholder="Tell potential clients about yourself, your experience, and what makes you unique..."
            {...register('bio')}
            rows={6}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {errors.bio && <p className="text-sm text-destructive">{errors.bio.message}</p>}
          <p className="mt-1.5 text-xs text-muted-foreground">
            Max 2000 characters. This will appear on your public profile.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
}
