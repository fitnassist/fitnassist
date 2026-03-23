import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { wizardImagesSchema, type WizardImagesInput } from '@fitnassist/schemas';
import { Button, ImageUpload } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import type { WizardStepProps } from '../../ProfileWizard/ProfileWizard.types';

export function ImagesStep({
  data,
  onUpdate,
  onNext,
  onBack,
}: WizardStepProps) {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<WizardImagesInput>({
    resolver: zodResolver(wizardImagesSchema),
    defaultValues: data.images,
  });

  const getUploadParamsMutation = trpc.upload.getUploadParams.useMutation();
  const deleteFileMutation = trpc.upload.deleteFile.useMutation();

  const handleUpload = async (file: File, type: 'profile' | 'cover'): Promise<string> => {
    // Get signed upload params from our API
    const params = await getUploadParamsMutation.mutateAsync({ type });

    // Upload directly to Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', params.apiKey);
    formData.append('timestamp', params.timestamp.toString());
    formData.append('signature', params.signature);
    formData.append('folder', params.folder);

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${params.cloudName}/${params.resourceType}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload image');
    }

    const result = await uploadResponse.json();
    return result.secure_url;
  };

  const handleDelete = async (url: string) => {
    try {
      await deleteFileMutation.mutateAsync({ url, resourceType: 'image' });
    } catch (error) {
      console.error('Failed to delete image:', error);
      // Still allow UI to proceed even if delete fails
    }
  };

  const onSubmit = (formData: WizardImagesInput) => {
    onUpdate('images', formData);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
          <Controller
            name="profileImageUrl"
            control={control}
            render={({ field }) => (
              <ImageUpload
                label="Profile Photo"
                description="A clear headshot works best."
                value={field.value || undefined}
                onChange={(url) => field.onChange(url || '')}
                onUpload={(file) => handleUpload(file, 'profile')}
                onDelete={handleDelete}
                aspectRatio="square"
                error={errors.profileImageUrl?.message}
              />
            )}
          />

          <Controller
            name="coverImageUrl"
            control={control}
            render={({ field }) => (
              <ImageUpload
                label="Cover Photo"
                description="Show your training environment or action shots."
                value={field.value || undefined}
                onChange={(url) => field.onChange(url || '')}
                onUpload={(file) => handleUpload(file, 'cover')}
                onDelete={handleDelete}
                aspectRatio="cover"
                dropZoneClassName="md:!aspect-auto md:h-[200px]"
                maxSizeMB={10}
                error={errors.coverImageUrl?.message}
              />
            )}
          />
        </div>

        <p className="text-sm text-muted-foreground">
          Images are optional but highly recommended. Profiles with photos get more engagement.
        </p>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">
          Continue
        </Button>
      </div>
    </form>
  );
}
