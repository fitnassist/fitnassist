import { useForm } from 'react-hook-form';
import { Button, Input, Label } from '@/components/ui';
import { useUpdateSection } from '@/api/website';

interface VideoContent {
  videoUrl: string;
  caption: string;
}

interface VideoFormProps {
  sectionId: string;
  content: Record<string, unknown>;
}

export const VideoForm = ({ sectionId, content }: VideoFormProps) => {
  const updateSection = useUpdateSection();

  const { register, handleSubmit } = useForm<VideoContent>({
    defaultValues: {
      videoUrl: (content.videoUrl as string) || '',
      caption: (content.caption as string) || '',
    },
  });

  const onSubmit = (data: VideoContent) => {
    updateSection.mutate({ sectionId, content: data });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="videoUrl">Video URL</Label>
        <Input
          id="videoUrl"
          {...register('videoUrl')}
          placeholder="https://youtube.com/watch?v=..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="caption">Caption</Label>
        <Input id="caption" {...register('caption')} placeholder="Optional caption" />
      </div>

      <Button type="submit" disabled={updateSection.isPending}>
        {updateSection.isPending ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
};
