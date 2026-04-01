import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button, Input, Label, ImageUpload, Select, type SelectOption } from '@/components/ui';
import { useUpdateSection } from '@/api/website';
import { useWebsiteUpload } from '../../hooks';

interface HeroContent {
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaLink: string;
  ctaLinkType: string;
  backgroundImageUrl: string;
  overlayOpacity: number;
}

interface HeroFormProps {
  sectionId: string;
  content: Record<string, unknown>;
}

const CTA_LINK_TYPE_OPTIONS: SelectOption[] = [
  { value: 'section', label: 'Scroll to Section' },
  { value: 'external', label: 'External URL' },
];

const SECTION_LINK_OPTIONS: SelectOption[] = [
  { value: '#about', label: 'About' },
  { value: '#services', label: 'Services' },
  { value: '#gallery', label: 'Gallery' },
  { value: '#testimonials', label: 'Testimonials' },
  { value: '#pricing', label: 'Pricing' },
  { value: '#contact', label: 'Contact' },
  { value: '#faq', label: 'FAQ' },
  { value: '#blog', label: 'Blog' },
  { value: '#video', label: 'Video' },
  { value: '#cta', label: 'Call to Action' },
];

const inferLinkType = (link: string): string => {
  if (!link || link.startsWith('#')) return 'section';
  return 'external';
};

export const HeroForm = ({ sectionId, content }: HeroFormProps) => {
  const updateSection = useUpdateSection();
  const { uploadImage, deleteFile } = useWebsiteUpload();
  const [imageUrl, setImageUrl] = useState<string>((content.backgroundImageUrl as string) || '');

  const ctaLinkValue = (content.ctaLink as string) || '';

  const { register, handleSubmit, control, watch } = useForm<HeroContent>({
    values: {
      headline: (content.headline as string) || '',
      subheadline: (content.subheadline as string) || '',
      ctaText: (content.ctaText as string) || '',
      ctaLink: ctaLinkValue,
      ctaLinkType: (content.ctaLinkType as string) || inferLinkType(ctaLinkValue),
      backgroundImageUrl: (content.backgroundImageUrl as string) || '',
      overlayOpacity: (content.overlayOpacity as number) ?? 50,
    },
  });

  const ctaLinkType = watch('ctaLinkType');

  const onSubmit = (data: HeroContent) => {
    updateSection.mutate({ sectionId, content: { ...data, backgroundImageUrl: imageUrl } });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="headline">Headline</Label>
        <Input id="headline" {...register('headline')} placeholder="Your headline" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subheadline">Subheadline</Label>
        <Input id="subheadline" {...register('subheadline')} placeholder="Your subheadline" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ctaText">CTA Button Text</Label>
        <Input id="ctaText" {...register('ctaText')} placeholder="Get Started" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="hero-cta-link-type">CTA Link Type</Label>
        <Controller
          name="ctaLinkType"
          control={control}
          render={({ field }) => (
            <Select
              inputId="hero-cta-link-type"
              options={CTA_LINK_TYPE_OPTIONS}
              value={CTA_LINK_TYPE_OPTIONS.find((o) => o.value === field.value) || null}
              onChange={(option) => field.onChange(option?.value || 'section')}
            />
          )}
        />
      </div>

      {ctaLinkType === 'section' ? (
        <div className="space-y-2">
          <Label htmlFor="hero-scroll-to-section">Scroll to Section</Label>
          <Controller
            name="ctaLink"
            control={control}
            render={({ field }) => (
              <Select
                inputId="hero-scroll-to-section"
                options={SECTION_LINK_OPTIONS}
                value={SECTION_LINK_OPTIONS.find((o) => o.value === field.value) || null}
                onChange={(option) => field.onChange(option?.value || '')}
                placeholder="Select a section..."
              />
            )}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="ctaLink">External URL</Label>
          <Input id="ctaLink" {...register('ctaLink')} placeholder="https://..." />
        </div>
      )}

      <div className="space-y-2">
        <Label>Background Image</Label>
        <ImageUpload
          value={imageUrl}
          onChange={(url) => setImageUrl(url ?? '')}
          onUpload={uploadImage}
          onDelete={(url) => deleteFile(url)}
          aspectRatio="cover"
          maxSizeMB={10}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="overlayOpacity">Overlay Opacity (%)</Label>
        <Input
          id="overlayOpacity"
          type="range"
          min={0}
          max={100}
          step={5}
          {...register('overlayOpacity', { valueAsNumber: true })}
          className="h-8"
        />
      </div>

      <Button type="submit" disabled={updateSection.isPending}>
        {updateSection.isPending ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
};
