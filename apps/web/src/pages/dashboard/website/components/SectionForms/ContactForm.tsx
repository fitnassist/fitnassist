import { useForm } from 'react-hook-form';
import { Button, Checkbox, Input, Label } from '@/components/ui';
import { useUpdateSection } from '@/api/website';

interface ContactContent {
  showForm: boolean;
  showEmail: boolean;
  showPhone: boolean;
  showAddress: boolean;
  showBookingLink: boolean;
  bookingUrl: string;
  bookingLabel: string;
  address: string;
}

interface ContactFormProps {
  sectionId: string;
  content: Record<string, unknown>;
}

const TOGGLE_FIELDS: { name: keyof Pick<ContactContent, 'showForm' | 'showEmail' | 'showPhone' | 'showAddress' | 'showBookingLink'>; label: string; description?: string }[] = [
  { name: 'showForm', label: 'Show callback & connect buttons', description: 'Allow visitors to request a callback or connect with you through Fitnassist' },
  { name: 'showEmail', label: 'Show email address' },
  { name: 'showPhone', label: 'Show phone number' },
  { name: 'showAddress', label: 'Show address / location' },
  { name: 'showBookingLink', label: 'Show booking link' },
];

export const ContactForm = ({ sectionId, content }: ContactFormProps) => {
  const updateSection = useUpdateSection();

  const { setValue, watch, register, handleSubmit } = useForm<ContactContent>({
    defaultValues: {
      showForm: (content.showForm as boolean) ?? true,
      showEmail: (content.showEmail as boolean) ?? true,
      showPhone: (content.showPhone as boolean) ?? true,
      showAddress: (content.showAddress as boolean) ?? false,
      showBookingLink: (content.showBookingLink as boolean) ?? false,
      bookingUrl: (content.bookingUrl as string) || '',
      bookingLabel: (content.bookingLabel as string) || '',
      address: (content.address as string) || '',
    },
  });

  const showAddress = watch('showAddress');
  const showBookingLink = watch('showBookingLink');

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
              <Label htmlFor={name} className="text-sm font-normal cursor-pointer">
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
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            {...register('address')}
            placeholder="123 High Street, London SW1A 1AA"
          />
          <p className="text-xs text-muted-foreground">
            If left blank, your profile address will be used.
          </p>
        </div>
      )}

      {showBookingLink && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="bookingUrl">Booking URL</Label>
            <Input
              id="bookingUrl"
              {...register('bookingUrl')}
              placeholder="https://calendly.com/..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bookingLabel">Booking Button Label</Label>
            <Input
              id="bookingLabel"
              {...register('bookingLabel')}
              placeholder="Book a session"
            />
          </div>
        </div>
      )}

      <Button type="submit" disabled={updateSection.isPending}>
        {updateSection.isPending ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
};
