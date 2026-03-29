import { useForm, Controller } from 'react-hook-form';
import { Button, Input, Label, Textarea, Select, type SelectOption } from '@/components/ui';
import { useUpdateSection } from '@/api/website';

interface AboutContent {
  richText: string;
  imageUrl: string;
  imagePosition: string;
}

interface AboutFormProps {
  sectionId: string;
  content: Record<string, unknown>;
}

const IMAGE_POSITION_OPTIONS: SelectOption[] = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
];

export const AboutForm = ({ sectionId, content }: AboutFormProps) => {
  const updateSection = useUpdateSection();

  const { register, handleSubmit, control } = useForm<AboutContent>({
    defaultValues: {
      richText: (content.richText as string) || '',
      imageUrl: (content.imageUrl as string) || '',
      imagePosition: (content.imagePosition as string) || 'right',
    },
  });

  const onSubmit = (data: AboutContent) => {
    updateSection.mutate({ sectionId, content: data });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="richText">About Text</Label>
        <Textarea
          id="richText"
          {...register('richText')}
          placeholder="Tell visitors about yourself..."
          rows={6}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input id="imageUrl" {...register('imageUrl')} placeholder="https://..." />
      </div>

      <div className="space-y-2">
        <Label>Image Position</Label>
        <Controller
          name="imagePosition"
          control={control}
          render={({ field }) => (
            <Select
              options={IMAGE_POSITION_OPTIONS}
              value={IMAGE_POSITION_OPTIONS.find((o) => o.value === field.value) || null}
              onChange={(option) => field.onChange(option?.value || 'right')}
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
