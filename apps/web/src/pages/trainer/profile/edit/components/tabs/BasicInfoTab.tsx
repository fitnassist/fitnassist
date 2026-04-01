import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { wizardBasicInfoSchema, type WizardBasicInfoInput } from '@fitnassist/schemas';
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { toast } from '@/lib/toast';
import { useState } from 'react';

interface BasicInfoTabProps {
  profile: {
    handle: string;
    displayName: string;
    bio: string | null;
  };
}

export function BasicInfoTab({ profile }: BasicInfoTabProps) {
  const [isSaving, setIsSaving] = useState(false);

  const utils = trpc.useUtils();
  const updateMutation = trpc.trainer.update.useMutation({
    onSuccess: () => {
      utils.trainer.getMyProfile.invalidate();
      toast.success('Profile updated');
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<WizardBasicInfoInput>({
    resolver: zodResolver(wizardBasicInfoSchema),
    defaultValues: {
      handle: profile.handle,
      displayName: profile.displayName,
      bio: profile.bio || '',
    },
  });

  const onSubmit = async (data: WizardBasicInfoInput) => {
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
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>
          Update your display name and bio. Your handle cannot be changed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="handle">Profile URL</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">fitnassist.co/trainers/</span>
              <Input id="handle" {...register('handle')} disabled className="flex-1 bg-muted" />
            </div>
            <p className="text-xs text-muted-foreground">
              Your handle cannot be changed after profile creation.
            </p>
          </div>

          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input id="displayName" placeholder="John Smith" {...register('displayName')} />
            {errors.displayName && (
              <p className="text-sm text-destructive">{errors.displayName.message}</p>
            )}
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
            <p className="text-xs text-muted-foreground">
              Max 2000 characters. This will appear on your public profile.
            </p>
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
}
