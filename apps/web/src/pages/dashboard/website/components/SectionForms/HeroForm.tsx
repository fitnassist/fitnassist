import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input, Label, ImageUpload } from '@/components/ui';
import { useUpdateSection } from '@/api/website';
import { useWebsiteUpload } from '../../hooks';

interface HeroContent {
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaLink: string;
  backgroundImageUrl: string;
  overlayOpacity: number;
}

interface HeroFormProps {
  sectionId: string;
  content: Record<string, unknown>;
}

export const HeroForm = ({ sectionId, content }: HeroFormProps) => {
  const updateSection = useUpdateSection();
  const { uploadImage, deleteFile } = useWebsiteUpload();
  const [imageUrl, setImageUrl] = useState<string>((content.backgroundImageUrl as string) || '');

  const { register, handleSubmit } = useForm<HeroContent>({
    defaultValues: {
      headline: (content.headline as string) || '',
      subheadline: (content.subheadline as string) || '',
      ctaText: (content.ctaText as string) || '',
      ctaLink: (content.ctaLink as string) || '',
      backgroundImageUrl: (content.backgroundImageUrl as string) || '',
      overlayOpacity: (content.overlayOpacity as number) ?? 50,
    },
  });

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
