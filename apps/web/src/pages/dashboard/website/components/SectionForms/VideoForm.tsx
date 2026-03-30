import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input, Label, VideoUpload } from '@/components/ui';
import { useUpdateSection } from '@/api/website';
import { useWebsiteUpload } from '../../hooks';

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
  const { uploadVideo, deleteFile } = useWebsiteUpload();
  const [videoUrl, setVideoUrl] = useState<string>((content.videoUrl as string) || '');

  const { register, handleSubmit } = useForm<VideoContent>({
    values: {
      videoUrl: (content.videoUrl as string) || '',
      caption: (content.caption as string) || '',
    },
  });

  const onSubmit = (data: VideoContent) => {
    updateSection.mutate({ sectionId, content: { ...data, videoUrl } });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Video</Label>
        <VideoUpload
          value={videoUrl}
          onChange={(url) => setVideoUrl(url ?? '')}
          onUpload={uploadVideo}
          onDelete={(url) => deleteFile(url, 'video')}
          maxSizeMB={100}
        />
        <p className="text-xs text-muted-foreground">
          Upload a video or paste a URL (YouTube, Vimeo, etc.)
        </p>
        <Input
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="Or paste a video URL (https://youtube.com/...)"
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
