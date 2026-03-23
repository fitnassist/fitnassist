import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Phone } from 'lucide-react';
import { wizardLocationSchema, type WizardLocationInput } from '@fitnassist/schemas';
import { Button, Input, Label, AddressAutocomplete, type AddressDetails } from '@/components/ui';
import { env } from '@/config/env';
import type { WizardStepProps } from '../../ProfileWizard/ProfileWizard.types';

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

export function LocationStep({
  data,
  onUpdate,
  onNext,
  onBack,
}: WizardStepProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<WizardLocationInput>({
    resolver: zodResolver(wizardLocationSchema),
    defaultValues: data.location,
  });

  const handleAddressChange = (address: AddressDetails | null) => {
    if (address) {
      setValue('addressLine1', address.addressLine1);
      setValue('addressLine2', address.addressLine2);
      setValue('city', address.city);
      setValue('county', address.county);
      setValue('postcode', address.postcode);
      setValue('country', address.country);
      setValue('placeId', address.placeId);
      setValue('latitude', address.latitude);
      setValue('longitude', address.longitude);
    } else {
      setValue('addressLine1', '');
      setValue('addressLine2', '');
      setValue('city', '');
      setValue('county', '');
      setValue('postcode', '');
      setValue('country', 'GB');
      setValue('placeId', '');
      setValue('latitude', undefined);
      setValue('longitude', undefined);
    }
  };

  const onSubmit = (formData: WizardLocationInput) => {
    onUpdate('location', formData);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-6">
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
                addressLine2: data.location.addressLine2 || '',
                city: data.location.city || '',
                county: data.location.county || '',
                postcode: data.location.postcode || '',
                country: data.location.country || 'GB',
                placeId: data.location.placeId || '',
                latitude: data.location.latitude || 0,
                longitude: data.location.longitude || 0,
              }}
              onChange={handleAddressChange}
              error={errors.postcode?.message || errors.addressLine1?.message}
            />
          )}
        />

        {/* Phone Number */}
        <div>
          <Label htmlFor="phoneNumber" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Phone Number
          </Label>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="+44 7123 456789"
            {...register('phoneNumber')}
          />
          {errors.phoneNumber && (
            <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Used for SMS appointment reminders. Never shared publicly.
          </p>
        </div>

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
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
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
