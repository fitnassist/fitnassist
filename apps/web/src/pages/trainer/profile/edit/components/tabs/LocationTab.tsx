import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { wizardLocationSchema, type WizardLocationInput } from '@fitnassist/schemas';
import {
  Button,
  Label,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  AddressAutocomplete,
  type AddressDetails,
} from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { toast } from '@/lib/toast';
import { env } from '@/config/env';
import { useState } from 'react';

const TRAVEL_OPTIONS = [
  {
    value: 'CLIENT_TRAVELS' as const,
    label: 'Client travels to me',
    description: 'Clients come to your location (gym, studio, etc.)',
  },
  {
    value: 'TRAINER_TRAVELS' as const,
    label: 'I travel to clients',
    description: 'You travel to client homes, parks, etc.',
  },
  {
    value: 'BOTH' as const,
    label: 'Both options',
    description: 'Flexible - either you or the client can travel',
  },
];

interface LocationTabProps {
  profile: {
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    county: string | null;
    postcode: string | null;
    country: string | null;
    placeId: string | null;
    latitude: number | null;
    longitude: number | null;
    travelOption: 'CLIENT_TRAVELS' | 'TRAINER_TRAVELS' | 'BOTH' | null;
  };
}

export function LocationTab({ profile }: LocationTabProps) {
  const [isSaving, setIsSaving] = useState(false);

  const utils = trpc.useUtils();
  const updateMutation = trpc.trainer.update.useMutation({
    onSuccess: () => {
      utils.trainer.getMyProfile.invalidate();
      toast.success('Location updated');
    },
  });

  const {
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<WizardLocationInput>({
    resolver: zodResolver(wizardLocationSchema),
    defaultValues: {
      addressLine1: profile.addressLine1 || '',
      addressLine2: profile.addressLine2 || '',
      city: profile.city || '',
      county: profile.county || '',
      postcode: profile.postcode || '',
      country: profile.country || 'GB',
      placeId: profile.placeId || '',
      latitude: profile.latitude || undefined,
      longitude: profile.longitude || undefined,
      travelOption: profile.travelOption || 'CLIENT_TRAVELS',
    },
  });

  const watchedValues = watch();

  const handleAddressChange = (address: AddressDetails | null) => {
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
      setValue('country', 'GB', { shouldDirty: true });
      setValue('placeId', '', { shouldDirty: true });
      setValue('latitude', undefined, { shouldDirty: true });
      setValue('longitude', undefined, { shouldDirty: true });
    }
  };

  const onSubmit = async (data: WizardLocationInput) => {
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({
        addressLine1: data.addressLine1 || undefined,
        addressLine2: data.addressLine2 || undefined,
        city: data.city || undefined,
        county: data.county || undefined,
        postcode: data.postcode,
        country: data.country,
        placeId: data.placeId || undefined,
        latitude: data.latitude,
        longitude: data.longitude,
        travelOption: data.travelOption,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location & Contact</CardTitle>
        <CardDescription>
          Update your address and contact preferences. Only your postcode area will be shown
          publicly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Address Autocomplete */}
          <Controller
            name="addressLine1"
            control={control}
            render={({ field }) => (
              <AddressAutocomplete
                apiKey={env.GOOGLE_MAPS_API_KEY}
                label="Your Address"
                value={{
                  addressLine1: field.value || '',
                  addressLine2: watchedValues.addressLine2 || '',
                  city: watchedValues.city || '',
                  county: watchedValues.county || '',
                  postcode: watchedValues.postcode || '',
                  country: watchedValues.country || 'GB',
                  placeId: watchedValues.placeId || '',
                  latitude: watchedValues.latitude || 0,
                  longitude: watchedValues.longitude || 0,
                }}
                onChange={handleAddressChange}
                error={errors.postcode?.message || errors.addressLine1?.message}
              />
            )}
          />

          {/* Travel Options */}
          <div className="space-y-3">
            <Label>Training Location Preference</Label>
            <Controller
              name="travelOption"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  {TRAVEL_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-accent ${
                        field.value === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-input'
                      }`}
                    >
                      <input
                        type="radio"
                        name="travelOption"
                        value={option.value}
                        checked={field.value === option.value}
                        onChange={() => field.onChange(option.value)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium">{option.label}</p>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            />
            {errors.travelOption && (
              <p className="text-sm text-destructive">{errors.travelOption.message}</p>
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
}
