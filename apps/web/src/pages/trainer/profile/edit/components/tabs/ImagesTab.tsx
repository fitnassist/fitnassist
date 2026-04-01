import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { wizardImagesSchema, type WizardImagesInput } from '@fitnassist/schemas';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ImageUpload,
  GalleryUpload,
  VideoUpload,
} from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { toast } from '@/lib/toast';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import type { GalleryImage } from '@/components/ui';

interface ImagesTabProps {
  profile: {
    id: string;
    profileImageUrl: string | null;
    coverImageUrl: string | null;
    videoIntroUrl: string | null;
  };
}

export function ImagesTab({ profile }: ImagesTabProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { hasAccess: hasGalleryAccess, requiredTier: galleryTier } = useFeatureAccess('gallery');

  const utils = trpc.useUtils();
  const updateMutation = trpc.trainer.update.useMutation({
    onSuccess: () => {
      utils.trainer.getMyProfile.invalidate();
      toast.success('Images updated');
    },
  });

  const getUploadParamsMutation = trpc.upload.getUploadParams.useMutation();
  const deleteFileMutation = trpc.upload.deleteFile.useMutation();

  // Gallery queries/mutations
  const { data: galleryImages = [] } = trpc.gallery.list.useQuery({ trainerId: profile.id });
  const addGalleryMutation = trpc.gallery.add.useMutation({
    onSuccess: () => utils.gallery.list.invalidate({ trainerId: profile.id }),
  });
  const removeGalleryMutation = trpc.gallery.remove.useMutation({
    onSuccess: () => utils.gallery.list.invalidate({ trainerId: profile.id }),
  });
  const reorderGalleryMutation = trpc.gallery.reorder.useMutation({
    onSuccess: () => utils.gallery.list.invalidate({ trainerId: profile.id }),
  });

  const {
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<WizardImagesInput>({
    resolver: zodResolver(wizardImagesSchema),
    defaultValues: {
      profileImageUrl: profile.profileImageUrl || '',
      coverImageUrl: profile.coverImageUrl || '',
    },
  });

  const uploadToCloudinary = async (
    file: File,
    type: 'profile' | 'cover' | 'gallery' | 'video-intro',
  ): Promise<string> => {
    const params = await getUploadParamsMutation.mutateAsync({ type });

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
      },
    );

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload file');
    }

    const result = await uploadResponse.json();
    return result.secure_url;
  };

  const handleDelete = async (url: string, resourceType: 'image' | 'video' = 'image') => {
    try {
      await deleteFileMutation.mutateAsync({ url, resourceType });
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const handleGalleryUpload = async (file: File) => {
    const url = await uploadToCloudinary(file, 'gallery');
    await addGalleryMutation.mutateAsync({ url });
  };

  const handleGalleryRemove = async (id: string) => {
    await removeGalleryMutation.mutateAsync({ id });
  };

  const handleGalleryReorder = async (imageIds: string[]) => {
    await reorderGalleryMutation.mutateAsync({ imageIds });
  };

  const handleVideoUpload = async (file: File): Promise<string> => {
    const url = await uploadToCloudinary(file, 'video-intro');
    await updateMutation.mutateAsync({ videoIntroUrl: url });
    return url;
  };

  const handleVideoDelete = async (url: string) => {
    await handleDelete(url, 'video');
    await updateMutation.mutateAsync({ videoIntroUrl: null });
  };

  const onSubmit = async (data: WizardImagesInput) => {
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({
        profileImageUrl: data.profileImageUrl || undefined,
        coverImageUrl: data.coverImageUrl || undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const mappedGalleryImages: GalleryImage[] = galleryImages.map((img) => ({
    id: img.id,
    url: img.url,
    sortOrder: img.sortOrder,
  }));

  return (
    <div className="space-y-6">
      {/* Profile & Cover Photos */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Images</CardTitle>
          <CardDescription>Update your profile photo and cover image.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
              <Controller
                name="profileImageUrl"
                control={control}
                render={({ field }) => (
                  <ImageUpload
                    label="Profile Photo"
                    description="Square headshot"
                    value={field.value || undefined}
                    onChange={(url) => field.onChange(url || '')}
                    onUpload={(file) => uploadToCloudinary(file, 'profile')}
                    onDelete={(url) => handleDelete(url)}
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
                    description="Wide image for your profile banner"
                    value={field.value || undefined}
                    onChange={(url) => field.onChange(url || '')}
                    onUpload={(file) => uploadToCloudinary(file, 'cover')}
                    onDelete={(url) => handleDelete(url)}
                    aspectRatio="cover"
                    dropZoneClassName="md:!aspect-auto md:h-[200px]"
                    maxSizeMB={10}
                    error={errors.coverImageUrl?.message}
                  />
                )}
              />
            </div>

            {updateMutation.error && (
              <p className="text-sm text-destructive">{updateMutation.error.message}</p>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving || !isDirty}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Gallery Photos */}
      {hasGalleryAccess ? (
        <Card>
          <CardHeader>
            <CardTitle>Gallery</CardTitle>
            <CardDescription>
              Showcase your work, training environment, and client transformations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GalleryUpload
              images={mappedGalleryImages}
              onUpload={handleGalleryUpload}
              onRemove={handleGalleryRemove}
              onReorder={handleGalleryReorder}
              maxImages={6}
              maxSizeMB={10}
            />
          </CardContent>
        </Card>
      ) : (
        <UpgradePrompt requiredTier={galleryTier} featureName="Gallery" />
      )}

      {/* Video Introduction */}
      {hasGalleryAccess ? (
        <Card>
          <CardHeader>
            <CardTitle>Video Introduction</CardTitle>
            <CardDescription>
              Record a short video introducing yourself to potential clients.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VideoUpload
              value={profile.videoIntroUrl || undefined}
              onChange={() => {}}
              onUpload={handleVideoUpload}
              onDelete={handleVideoDelete}
              description="A 30-60 second intro video works best."
              maxSizeMB={50}
            />
          </CardContent>
        </Card>
      ) : (
        <UpgradePrompt requiredTier={galleryTier} featureName="Video Introduction" />
      )}
    </div>
  );
}
