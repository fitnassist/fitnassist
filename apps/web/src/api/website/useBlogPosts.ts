import { trpc } from '@/lib/trpc';
import { queryClient } from '@/lib/queryClient';

const invalidateBlog = () => {
  queryClient.invalidateQueries({ queryKey: [['blog']] });
};

export const useMyBlogPosts = () => {
  return trpc.blog.getMyPosts.useQuery();
};

export const useCreateBlogPost = () => {
  return trpc.blog.create.useMutation({
    onSuccess: invalidateBlog,
  });
};

export const useUpdateBlogPost = () => {
  return trpc.blog.update.useMutation({
    onSuccess: invalidateBlog,
  });
};

export const useDeleteBlogPost = () => {
  return trpc.blog.delete.useMutation({
    onSuccess: invalidateBlog,
  });
};

export const usePublishBlogPost = () => {
  return trpc.blog.publish.useMutation({
    onSuccess: invalidateBlog,
  });
};

export const useUnpublishBlogPost = () => {
  return trpc.blog.unpublish.useMutation({
    onSuccess: invalidateBlog,
  });
};
