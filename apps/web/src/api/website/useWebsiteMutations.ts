import { trpc } from '@/lib/trpc';
import { queryClient } from '@/lib/queryClient';

const invalidateWebsite = () => {
  queryClient.invalidateQueries({ queryKey: [['website', 'getMyWebsite']] });
};

export const useCreateWebsite = () => {
  return trpc.website.create.useMutation({
    onSuccess: invalidateWebsite,
  });
};

export const useUpdateWebsiteSettings = () => {
  return trpc.website.updateSettings.useMutation({
    onSuccess: invalidateWebsite,
  });
};

export const useUpdateSubdomain = () => {
  return trpc.website.updateSubdomain.useMutation({
    onSuccess: invalidateWebsite,
  });
};

export const usePublishWebsite = () => {
  return trpc.website.publish.useMutation({
    onSuccess: invalidateWebsite,
  });
};

export const useUnpublishWebsite = () => {
  return trpc.website.unpublish.useMutation({
    onSuccess: invalidateWebsite,
  });
};
