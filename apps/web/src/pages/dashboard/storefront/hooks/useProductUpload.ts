import { trpc } from '@/lib/trpc';

export const useProductUpload = () => {
  const getUploadParamsMutation = trpc.upload.getUploadParams.useMutation();
  const deleteFileMutation = trpc.upload.deleteFile.useMutation();

  const uploadImage = async (file: File): Promise<string> => {
    const params = await getUploadParamsMutation.mutateAsync({ type: 'product-image' });

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

    if (!uploadResponse.ok) throw new Error('Failed to upload image');
    const result = await uploadResponse.json();
    return result.secure_url;
  };

  const uploadFile = async (file: File): Promise<string> => {
    const params = await getUploadParamsMutation.mutateAsync({ type: 'product-file' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', params.apiKey);
    formData.append('timestamp', params.timestamp.toString());
    formData.append('signature', params.signature);
    formData.append('folder', params.folder);

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${params.cloudName}/raw/upload`,
      { method: 'POST', body: formData },
    );

    if (!uploadResponse.ok) throw new Error('Failed to upload file');
    const result = await uploadResponse.json();
    return result.secure_url;
  };

  const deleteFile = async (url: string, resourceType: 'image' | 'raw' = 'image') => {
    try {
      await deleteFileMutation.mutateAsync({ url, resourceType: resourceType as 'image' | 'video' });
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  return { uploadImage, uploadFile, deleteFile, isUploading: getUploadParamsMutation.isPending };
};
