import { trpc } from '@/lib/trpc';
import { queryClient } from '@/lib/queryClient';
import { toast } from '@/lib/toast';

const invalidateBlog = () => {
  queryClient.invalidateQueries({ queryKey: [['blog']] });
};

export const useMyBlogPosts = () => {
  return trpc.blog.getMyPosts.useQuery();
};

export const useCreateBlogPost = () => {
  return trpc.blog.create.useMutation({
    onSuccess: () => {
      invalidateBlog();
      toast.success('Blog post created');
    },
    onError: () => toast.error('Failed to create blog post'),
  });
};

export const useUpdateBlogPost = () => {
  return trpc.blog.update.useMutation({
    onSuccess: () => {
      invalidateBlog();
      toast.success('Blog post saved');
    },
    onError: () => toast.error('Failed to save blog post'),
  });
};

export const useDeleteBlogPost = () => {
  return trpc.blog.delete.useMutation({
    onSuccess: () => {
      invalidateBlog();
      toast.success('Blog post deleted');
    },
    onError: () => toast.error('Failed to delete blog post'),
  });
};

export const usePublishBlogPost = () => {
  return trpc.blog.publish.useMutation({
    onSuccess: () => {
      invalidateBlog();
      toast.success('Blog post published');
    },
    onError: () => toast.error('Failed to publish blog post'),
  });
};

export const useUnpublishBlogPost = () => {
  return trpc.blog.unpublish.useMutation({
    onSuccess: () => {
      invalidateBlog();
      toast.success('Blog post unpublished');
    },
    onError: () => toast.error('Failed to unpublish blog post'),
  });
};
