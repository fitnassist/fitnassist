import { useForm, Controller } from 'react-hook-form';
import { Button, Input, Label, Select, type SelectOption } from '@/components/ui';
import { useUpdateSection } from '@/api/website';

interface CtaContent {
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaLink: string;
  style: string;
}

interface CtaFormProps {
  sectionId: string;
  content: Record<string, unknown>;
}

const STYLE_OPTIONS: SelectOption[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'accent', label: 'Accent' },
];

export const CtaForm = ({ sectionId, content }: CtaFormProps) => {
  const updateSection = useUpdateSection();

  const { register, handleSubmit, control } = useForm<CtaContent>({
    defaultValues: {
      headline: (content.headline as string) || '',
      subheadline: (content.subheadline as string) || '',
      ctaText: (content.ctaText as string) || '',
      ctaLink: (content.ctaLink as string) || '',
      style: (content.style as string) || 'accent',
    },
  });

  const onSubmit = (data: CtaContent) => {
    updateSection.mutate({ sectionId, content: data });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="headline">Headline</Label>
        <Input id="headline" {...register('headline')} placeholder="Ready to get started?" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subheadline">Subheadline</Label>
        <Input
          id="subheadline"
          {...register('subheadline')}
          placeholder="Join hundreds of happy clients"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ctaText">CTA Text</Label>
          <Input id="ctaText" {...register('ctaText')} placeholder="Get Started" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ctaLink">CTA Link</Label>
          <Input id="ctaLink" {...register('ctaLink')} placeholder="/contact" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Style</Label>
        <Controller
          name="style"
          control={control}
          render={({ field }) => (
            <Select
              options={STYLE_OPTIONS}
              value={STYLE_OPTIONS.find((o) => o.value === field.value) || null}
              onChange={(option) => field.onChange(option?.value || 'accent')}
            />
          )}
        />
      </div>

      <Button type="submit" disabled={updateSection.isPending}>
        {updateSection.isPending ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
};
