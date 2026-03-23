import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GENDER_OPTIONS, updateTraineeProfileSchema } from '@fitnassist/schemas';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
  ImageUpload,
  Select,
  type SelectOption,
} from '@/components/ui';
import { trpc } from '@/lib/trpc';

const personalInfoSchema = updateTraineeProfileSchema.pick({
  avatarUrl: true,
  bio: true,
  dateOfBirth: true,
  gender: true,
  location: true,
});

type PersonalInfoInput = z.infer<typeof personalInfoSchema>;

interface PersonalInfoTabProps {
  profile: {
    avatarUrl: string | null;
    bio: string | null;
    dateOfBirth: string | Date | null;
    gender: string | null;
    location: string | null;
  } | null;
}

const genderOptions = GENDER_OPTIONS.map((o) => ({ value: o.value, label: o.label }));

export const PersonalInfoTab = ({ profile }: PersonalInfoTabProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const getUploadParamsMutation = trpc.upload.getUploadParams.useMutation();

  const handleUpload = async (file: File): Promise<string> => {
    const params = await getUploadParamsMutation.mutateAsync({ type: 'profile' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', params.apiKey);
    formData.append('timestamp', params.timestamp.toString());
    formData.append('signature', params.signature);
    formData.append('folder', params.folder);
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${params.cloudName}/image/upload`,
      { method: 'POST', body: formData }
    );
    const result = await response.json();
    return result.secure_url;
  };

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
      setSuccessMessage('Profile updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const dobString = profile?.dateOfBirth
    ? new Date(profile.dateOfBirth).toISOString().split('T')[0]
    : '';

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<PersonalInfoInput>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      avatarUrl: profile?.avatarUrl || '',
      bio: profile?.bio || '',
      dateOfBirth: dobString,
      gender: (profile?.gender as PersonalInfoInput['gender']) || undefined,
      location: profile?.location || '',
    },
  });

  const mutation = profile ? updateMutation : createMutation;

  const onSubmit = async (data: PersonalInfoInput) => {
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
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>
          Update your personal details and profile photo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Controller
            name="avatarUrl"
            control={control}
            render={({ field }) => (
              <ImageUpload
                label="Profile Photo"
                description="A clear photo helps trainers recognise you."
                value={field.value || undefined}
                onChange={(url) => field.onChange(url || '')}
                onUpload={handleUpload}
                aspectRatio="square"
              />
            )}
          />

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell trainers about yourself..."
              {...register('bio')}
              rows={4}
            />
            {errors.bio && (
              <p className="text-sm text-destructive">{errors.bio.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                {...register('dateOfBirth')}
              />
            </div>

            <div>
              <Label>Gender</Label>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select
                    options={genderOptions}
                    value={genderOptions.find((o) => o.value === field.value) || null}
                    onChange={(opt: SelectOption | null) => field.onChange(opt?.value || undefined)}
                    placeholder="Prefer not to say"
                    isClearable
                  />
                )}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g. London, UK"
              {...register('location')}
            />
            {errors.location && (
              <p className="text-sm text-destructive">{errors.location.message}</p>
            )}
          </div>

          {mutation.error && (
            <p className="text-sm text-destructive">{mutation.error.message}</p>
          )}

          {successMessage && (
            <p className="text-sm text-green-600">{successMessage}</p>
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
