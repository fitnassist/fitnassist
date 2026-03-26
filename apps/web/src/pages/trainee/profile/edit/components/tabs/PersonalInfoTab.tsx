import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
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
  AddressAutocomplete,
  type AddressDetails,
  type SelectOption,
} from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { env } from '@/config/env';
import { useCheckHandleAvailability } from '@/api/trainee';
import { useDebounce } from '@/hooks';

const personalInfoSchema = updateTraineeProfileSchema.pick({
  avatarUrl: true,
  bio: true,
  dateOfBirth: true,
  gender: true,
  handle: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  county: true,
  postcode: true,
  country: true,
  placeId: true,
  latitude: true,
  longitude: true,
});

type PersonalInfoInput = z.infer<typeof personalInfoSchema>;

interface PersonalInfoTabProps {
  profile: {
    avatarUrl: string | null;
    bio: string | null;
    dateOfBirth: string | Date | null;
    gender: string | null;
    handle: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    county: string | null;
    postcode: string | null;
    country: string | null;
    placeId: string | null;
    latitude: number | null;
    longitude: number | null;
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
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<PersonalInfoInput>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      avatarUrl: profile?.avatarUrl || '',
      bio: profile?.bio || '',
      dateOfBirth: dobString,
      gender: (profile?.gender as PersonalInfoInput['gender']) || undefined,
      handle: profile?.handle || '',
      addressLine1: profile?.addressLine1 || '',
      addressLine2: profile?.addressLine2 || '',
      city: profile?.city || '',
      county: profile?.county || '',
      postcode: profile?.postcode || '',
      country: profile?.country || 'GB',
      placeId: profile?.placeId || '',
      latitude: profile?.latitude ?? undefined,
      longitude: profile?.longitude ?? undefined,
    },
  });

  const handleValue = watch('handle') || '';
  const debouncedHandle = useDebounce(handleValue, 500);
  const isHandleChanged = debouncedHandle !== (profile?.handle || '');
  const { data: handleCheck, isLoading: isCheckingHandle } = useCheckHandleAvailability(
    isHandleChanged ? debouncedHandle : '',
  );

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
            <Label htmlFor="handle">Handle</Label>
            <p className="text-xs text-muted-foreground mb-1.5">
              Your unique public profile URL. Only lowercase letters, numbers, hyphens, and underscores.
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
              <Input
                id="handle"
                placeholder="your-handle"
                className="pl-7"
                {...register('handle')}
              />
              {handleValue.length >= 3 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isCheckingHandle ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : isHandleChanged && handleCheck ? (
                    handleCheck.available ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )
                  ) : null}
                </span>
              )}
            </div>
            {errors.handle && (
              <p className="text-sm text-destructive">{errors.handle.message}</p>
            )}
            {isHandleChanged && handleCheck && !handleCheck.available && (
              <p className="text-sm text-destructive">{handleCheck.reason}</p>
            )}
            {handleValue && !errors.handle && (
              <p className="text-xs text-muted-foreground mt-1">
                Your profile will be at fitnassist.co/users/{handleValue}
              </p>
            )}
          </div>

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

          <AddressAutocomplete
            apiKey={env.GOOGLE_MAPS_API_KEY}
            label="Address"
            value={{
              addressLine1: watch('addressLine1') || '',
              addressLine2: watch('addressLine2') || '',
              city: watch('city') || '',
              county: watch('county') || '',
              postcode: watch('postcode') || '',
              country: watch('country') || 'GB',
              placeId: watch('placeId') || '',
              latitude: watch('latitude') || 0,
              longitude: watch('longitude') || 0,
            }}
            onChange={(address: AddressDetails | null) => {
              if (address) {
                setValue('addressLine1', address.addressLine1, { shouldDirty: true });
                setValue('addressLine2', address.addressLine2, { shouldDirty: true });
                setValue('city', address.city, { shouldDirty: true });
                setValue('county', address.county, { shouldDirty: true });
                setValue('postcode', address.postcode, { shouldDirty: true });
                setValue('country', address.country, { shouldDirty: true });
                setValue('placeId', address.placeId, { shouldDirty: true });
                setValue('latitude', address.latitude, { shouldDirty: true });
                setValue('longitude', address.longitude, { shouldDirty: true });
              } else {
                setValue('addressLine1', '', { shouldDirty: true });
                setValue('addressLine2', '', { shouldDirty: true });
                setValue('city', '', { shouldDirty: true });
                setValue('county', '', { shouldDirty: true });
                setValue('postcode', '', { shouldDirty: true });
                setValue('placeId', '', { shouldDirty: true });
                setValue('latitude', undefined, { shouldDirty: true });
                setValue('longitude', undefined, { shouldDirty: true });
              }
            }}
          />

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
