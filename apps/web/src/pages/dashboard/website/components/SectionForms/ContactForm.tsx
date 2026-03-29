import { useForm } from 'react-hook-form';
import { Button, Checkbox, Label } from '@/components/ui';
import { useUpdateSection } from '@/api/website';

interface ContactContent {
  showForm: boolean;
  showEmail: boolean;
  showPhone: boolean;
  showSocial: boolean;
  showMap: boolean;
  showBookingLink: boolean;
}

interface ContactFormProps {
  sectionId: string;
  content: Record<string, unknown>;
}

const FIELDS: { name: keyof ContactContent; label: string }[] = [
  { name: 'showForm', label: 'Show contact form' },
  { name: 'showEmail', label: 'Show email address' },
  { name: 'showPhone', label: 'Show phone number' },
  { name: 'showSocial', label: 'Show social links' },
  { name: 'showMap', label: 'Show map' },
  { name: 'showBookingLink', label: 'Show booking link' },
];

export const ContactForm = ({ sectionId, content }: ContactFormProps) => {
  const updateSection = useUpdateSection();

  const { setValue, watch, handleSubmit } = useForm<ContactContent>({
    defaultValues: {
      showForm: (content.showForm as boolean) ?? true,
      showEmail: (content.showEmail as boolean) ?? true,
      showPhone: (content.showPhone as boolean) ?? true,
      showSocial: (content.showSocial as boolean) ?? false,
      showMap: (content.showMap as boolean) ?? false,
      showBookingLink: (content.showBookingLink as boolean) ?? false,
    },
  });

  const onSubmit = (data: ContactContent) => {
    updateSection.mutate({ sectionId, content: data });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-3">
        {FIELDS.map(({ name, label }) => (
          <div key={name} className="flex items-center gap-2">
            <Checkbox
              id={name}
              checked={watch(name)}
              onCheckedChange={(checked) => setValue(name, !!checked)}
            />
            <Label htmlFor={name} className="text-sm font-normal cursor-pointer">
              {label}
            </Label>
          </div>
        ))}
      </div>

      <Button type="submit" disabled={updateSection.isPending}>
        {updateSection.isPending ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
};
