import { trpc } from '@/lib/trpc';
import { queryClient } from '@/lib/queryClient';
import { toast } from '@/lib/toast';

const invalidateWebsite = () => {
  queryClient.invalidateQueries({ queryKey: [['website', 'getMyWebsite']] });
};

export const useAddSection = () => {
  return trpc.website.addSection.useMutation({
    onSuccess: () => {
      invalidateWebsite();
      toast.success('Section added');
    },
    onError: () => toast.error('Failed to add section'),
  });
};

export const useUpdateSection = () => {
  return trpc.website.updateSection.useMutation({
    onSuccess: () => {
      invalidateWebsite();
      toast.success('Section saved');
    },
    onError: () => toast.error('Failed to save section'),
  });
};

export const useRemoveSection = () => {
  return trpc.website.removeSection.useMutation({
    onSuccess: () => {
      invalidateWebsite();
      toast.success('Section removed');
    },
    onError: () => toast.error('Failed to remove section'),
  });
};

export const useReorderSections = () => {
  return trpc.website.reorderSections.useMutation({
    onSuccess: invalidateWebsite,
    onError: () => toast.error('Failed to reorder sections'),
  });
};

export const useToggleSectionVisibility = () => {
  return trpc.website.toggleSectionVisibility.useMutation({
    onSuccess: invalidateWebsite,
    onError: () => toast.error('Failed to update visibility'),
  });
};
