import { trpc } from '@/lib/trpc';
import { queryClient } from '@/lib/queryClient';

const invalidateWebsite = () => {
  queryClient.invalidateQueries({ queryKey: [['website', 'getMyWebsite']] });
};

export const useAddSection = () => {
  return trpc.website.addSection.useMutation({
    onSuccess: invalidateWebsite,
  });
};

export const useUpdateSection = () => {
  return trpc.website.updateSection.useMutation({
    onSuccess: invalidateWebsite,
  });
};

export const useRemoveSection = () => {
  return trpc.website.removeSection.useMutation({
    onSuccess: invalidateWebsite,
  });
};

export const useReorderSections = () => {
  return trpc.website.reorderSections.useMutation({
    onSuccess: invalidateWebsite,
  });
};

export const useToggleSectionVisibility = () => {
  return trpc.website.toggleSectionVisibility.useMutation({
    onSuccess: invalidateWebsite,
  });
};
