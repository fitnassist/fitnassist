import { useForm } from 'react-hook-form';
import { Button, Label, Textarea } from '@/components/ui';
import { useUpdateSection } from '@/api/website';

interface CustomTextContent {
  richText: string;
}

interface CustomTextFormProps {
  sectionId: string;
  content: Record<string, unknown>;
}

export const CustomTextForm = ({ sectionId, content }: CustomTextFormProps) => {
  const updateSection = useUpdateSection();

  const { register, handleSubmit } = useForm<CustomTextContent>({
    defaultValues: {
      richText: (content.richText as string) || '',
    },
  });

  const onSubmit = (data: CustomTextContent) => {
    updateSection.mutate({ sectionId, content: data });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="richText">Content</Label>
        <Textarea
          id="richText"
          {...register('richText')}
          placeholder="Write your content here..."
          rows={8}
        />
      </div>

      <Button type="submit" disabled={updateSection.isPending}>
        {updateSection.isPending ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
};
