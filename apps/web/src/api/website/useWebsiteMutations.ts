import { trpc } from '@/lib/trpc';
import { queryClient } from '@/lib/queryClient';
import { toast } from '@/lib/toast';

const invalidateWebsite = () => {
  queryClient.invalidateQueries({ queryKey: [['website', 'getMyWebsite']] });
};

export const useCreateWebsite = () => {
  return trpc.website.create.useMutation({
    onSuccess: () => {
      invalidateWebsite();
      toast.success('Website created');
    },
    onError: () => toast.error('Failed to create website'),
  });
};

export const useUpdateWebsiteSettings = () => {
  return trpc.website.updateSettings.useMutation({
    onSuccess: () => {
      invalidateWebsite();
      toast.success('Settings saved');
    },
    onError: () => toast.error('Failed to save settings'),
  });
};

export const useUpdateSubdomain = () => {
  return trpc.website.updateSubdomain.useMutation({
    onSuccess: () => {
      invalidateWebsite();
      toast.success('Subdomain updated');
    },
    onError: (err) => toast.error(err.message || 'Failed to update subdomain'),
  });
};

export const usePublishWebsite = () => {
  return trpc.website.publish.useMutation({
    onSuccess: () => {
      invalidateWebsite();
      toast.success('Website published');
    },
    onError: () => toast.error('Failed to publish website'),
  });
};

export const useUnpublishWebsite = () => {
  return trpc.website.unpublish.useMutation({
    onSuccess: () => {
      invalidateWebsite();
      toast.success('Website unpublished');
    },
    onError: () => toast.error('Failed to unpublish website'),
  });
};
