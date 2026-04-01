import { trpc } from '@/lib/trpc';

export const useWebsiteUpload = () => {
  const getUploadParamsMutation = trpc.upload.getUploadParams.useMutation();
  const deleteFileMutation = trpc.upload.deleteFile.useMutation();

  const uploadImage = async (file: File): Promise<string> => {
    const params = await getUploadParamsMutation.mutateAsync({ type: 'website-image' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', params.apiKey);
    formData.append('timestamp', params.timestamp.toString());
    formData.append('signature', params.signature);
    formData.append('folder', params.folder);

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${params.cloudName}/${params.resourceType}/upload`,
      { method: 'POST', body: formData },
    );

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload image');
    }

    const result = await uploadResponse.json();
    return result.secure_url;
  };

  const uploadVideo = async (file: File): Promise<string> => {
    const params = await getUploadParamsMutation.mutateAsync({ type: 'website-video' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', params.apiKey);
    formData.append('timestamp', params.timestamp.toString());
    formData.append('signature', params.signature);
    formData.append('folder', params.folder);

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${params.cloudName}/${params.resourceType}/upload`,
      { method: 'POST', body: formData },
    );

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload video');
    }

    const result = await uploadResponse.json();
    return result.secure_url;
  };

  const deleteFile = async (url: string, resourceType: 'image' | 'video' = 'image') => {
    try {
      await deleteFileMutation.mutateAsync({ url, resourceType });
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  return { uploadImage, uploadVideo, deleteFile };
};
