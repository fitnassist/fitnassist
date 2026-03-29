import { useForm } from 'react-hook-form';
import { Button, Checkbox, Label, AddressAutocomplete } from '@/components/ui';
import type { AddressDetails } from '@/components/ui';
import { useUpdateSection } from '@/api/website';
import { env } from '@/config/env';

interface ContactContent {
  showForm: boolean;
  showEmail: boolean;
  showPhone: boolean;
  showAddress: boolean;
  address: string;
}

interface ContactFormProps {
  sectionId: string;
  content: Record<string, unknown>;
}

const TOGGLE_FIELDS: { name: keyof Pick<ContactContent, 'showForm' | 'showEmail' | 'showPhone' | 'showAddress'>; label: string; description?: string }[] = [
  { name: 'showForm', label: 'Show callback & connect buttons', description: 'Allow visitors to request a callback or connect with you through Fitnassist' },
  { name: 'showEmail', label: 'Show email address' },
  { name: 'showPhone', label: 'Show phone number' },
  { name: 'showAddress', label: 'Show address / location' },
];

const formatAddressString = (details: AddressDetails): string => {
  const parts = [
    details.addressLine1,
    details.addressLine2,
    details.city,
    details.postcode,
  ].filter(Boolean);
  return parts.join(', ');
};

export const ContactForm = ({ sectionId, content }: ContactFormProps) => {
  const updateSection = useUpdateSection();

  const { setValue, watch, handleSubmit } = useForm<ContactContent>({
    defaultValues: {
      showForm: (content.showForm as boolean) ?? true,
      showEmail: (content.showEmail as boolean) ?? true,
      showPhone: (content.showPhone as boolean) ?? true,
      showAddress: (content.showAddress as boolean) ?? false,
      address: (content.address as string) || '',
    },
  });

  const showAddress = watch('showAddress');
  const address = watch('address');

  const onSubmit = (data: ContactContent) => {
    updateSection.mutate({ sectionId, content: data });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-3">
        {TOGGLE_FIELDS.map(({ name, label, description }) => (
          <div key={name} className="flex items-start gap-2">
            <Checkbox
              id={name}
              checked={watch(name)}
              onCheckedChange={(checked) => setValue(name, !!checked)}
              className="mt-0.5"
            />
            <div>
              <Label htmlFor={name} className="text-sm font-normal cursor-pointer mb-0 inline">
                {label}
              </Label>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAddress && (
        <div className="space-y-2">
          <AddressAutocomplete
            label="Address"
            apiKey={env.GOOGLE_MAPS_API_KEY}
            value={address ? { addressLine1: address } : undefined}
            onChange={(details) => {
              setValue('address', details ? formatAddressString(details) : '');
            }}
          />
          <p className="text-xs text-muted-foreground">
            If left blank, your profile address will be used.
          </p>
        </div>
      )}

      <Button type="submit" disabled={updateSection.isPending}>
        {updateSection.isPending ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
};
