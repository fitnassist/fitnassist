import { trpc } from '@/lib/trpc';
import { queryClient } from '@/lib/queryClient';
import { toast } from '@/lib/toast';
import type { WebsiteData } from '@/pages/dashboard/website/website.types';

const QUERY_KEY = [['website', 'getMyWebsite']];

const invalidateWebsite = () => {
  queryClient.invalidateQueries({ queryKey: QUERY_KEY });
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
    onMutate: async ({ sectionIds }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });

      const previous = queryClient.getQueriesData({ queryKey: QUERY_KEY });

      queryClient.setQueriesData<WebsiteData>(
        { queryKey: QUERY_KEY },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            sections: old.sections.map((s) => ({
              ...s,
              sortOrder: sectionIds.indexOf(s.id),
            })),
          };
        }
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        for (const [key, data] of context.previous) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error('Failed to reorder sections');
    },
    onSettled: invalidateWebsite,
  });
};

export const useToggleSectionVisibility = () => {
  return trpc.website.toggleSectionVisibility.useMutation({
    onSuccess: invalidateWebsite,
    onError: () => toast.error('Failed to update visibility'),
  });
};
