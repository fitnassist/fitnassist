import { useForm } from 'react-hook-form';
import { Button, Checkbox, Label, AddressAutocomplete } from '@/components/ui';
import type { AddressDetails } from '@/components/ui';
import { useUpdateSection } from '@/api/website';
import { env } from '@/config/env';

type AddressSource = 'profile' | 'custom';
type AddressDetail = 'postcode' | 'full';

interface ContactContent {
  showForm: boolean;
  showEmail: boolean;
  showPhone: boolean;
  showAddress: boolean;
  addressSource: AddressSource;
  addressDetail: AddressDetail;
  customAddress: string;
  customLatitude: number | null;
  customLongitude: number | null;
}

interface ContactFormProps {
  sectionId: string;
  content: Record<string, unknown>;
}

const TOGGLE_FIELDS: { name: keyof Pick<ContactContent, 'showForm' | 'showEmail' | 'showPhone' | 'showAddress'>; label: string; description?: string }[] = [
  { name: 'showForm', label: 'Show callback & connect buttons', description: 'Allow visitors to request a callback or connect with you through Fitnassist' },
  { name: 'showEmail', label: 'Show email address' },
  { name: 'showPhone', label: 'Show phone number' },
  { name: 'showAddress', label: 'Show address & map' },
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
      addressSource: (content.addressSource as AddressSource) ?? 'profile',
      addressDetail: (content.addressDetail as AddressDetail) ?? 'postcode',
      customAddress: (content.customAddress as string) || (content.address as string) || '',
      customLatitude: (content.customLatitude as number) ?? null,
      customLongitude: (content.customLongitude as number) ?? null,
    },
  });

  const showAddress = watch('showAddress');
  const addressSource = watch('addressSource');
  const addressDetail = watch('addressDetail');
  const customAddress = watch('customAddress');

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
        <div className="space-y-4 rounded-md border p-3">
          {/* Address source */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Address source</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={addressSource === 'profile' ? 'default' : 'outline'}
                onClick={() => setValue('addressSource', 'profile')}
              >
                From profile
              </Button>
              <Button
                type="button"
                size="sm"
                variant={addressSource === 'custom' ? 'default' : 'outline'}
                onClick={() => setValue('addressSource', 'custom')}
              >
                Custom address
              </Button>
            </div>
            {addressSource === 'profile' && (
              <p className="text-xs text-muted-foreground">
                Uses the address from your trainer profile settings.
              </p>
            )}
          </div>

          {/* Custom address lookup */}
          {addressSource === 'custom' && (
            <AddressAutocomplete
              label="Custom address"
              apiKey={env.GOOGLE_MAPS_API_KEY}
              value={customAddress ? { addressLine1: customAddress } : undefined}
              onChange={(details) => {
                if (details) {
                  setValue('customAddress', formatAddressString(details));
                  setValue('customLatitude', details.latitude);
                  setValue('customLongitude', details.longitude);
                } else {
                  setValue('customAddress', '');
                  setValue('customLatitude', null);
                  setValue('customLongitude', null);
                }
              }}
            />
          )}

          {/* Detail level */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Location detail shown to visitors</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={addressDetail === 'postcode' ? 'default' : 'outline'}
                onClick={() => setValue('addressDetail', 'postcode')}
              >
                Postcode area only
              </Button>
              <Button
                type="button"
                size="sm"
                variant={addressDetail === 'full' ? 'default' : 'outline'}
                onClick={() => setValue('addressDetail', 'full')}
              >
                Full address
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {addressDetail === 'postcode'
                ? 'Shows your general area (e.g. "SW1A area") and a zoomed-out map.'
                : 'Shows your full address and a close-up map with pin.'}
            </p>
          </div>
        </div>
      )}

      <Button type="submit" disabled={updateSection.isPending}>
        {updateSection.isPending ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
};
