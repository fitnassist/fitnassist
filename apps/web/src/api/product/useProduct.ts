import { trpc } from '@/lib/trpc';
import { queryClient } from '@/lib/queryClient';
import { toast } from '@/lib/toast';

const invalidateProducts = () => {
  queryClient.invalidateQueries({ queryKey: [['product']] });
};

export const useProducts = () => {
  return trpc.product.list.useQuery();
};

export const useProduct = (productId: string) => {
  return trpc.product.get.useQuery({ productId }, { enabled: !!productId });
};

export const useCreateProduct = () => {
  return trpc.product.create.useMutation({
    onSuccess: () => {
      invalidateProducts();
      toast.success('Product created');
    },
    onError: (err) => toast.error(err.message || 'Failed to create product'),
  });
};

export const useUpdateProduct = () => {
  return trpc.product.update.useMutation({
    onSuccess: () => {
      invalidateProducts();
      toast.success('Product updated');
    },
    onError: (err) => toast.error(err.message || 'Failed to update product'),
  });
};

export const useDeleteProduct = () => {
  return trpc.product.delete.useMutation({
    onSuccess: () => {
      invalidateProducts();
      toast.success('Product deleted');
    },
    onError: (err) => toast.error(err.message || 'Failed to delete product'),
  });
};

export const usePublishProduct = () => {
  return trpc.product.publish.useMutation({
    onSuccess: () => {
      invalidateProducts();
      toast.success('Product published');
    },
    onError: (err) => toast.error(err.message || 'Failed to publish product'),
  });
};

export const useArchiveProduct = () => {
  return trpc.product.archive.useMutation({
    onSuccess: () => {
      invalidateProducts();
      toast.success('Product archived');
    },
    onError: (err) => toast.error(err.message || 'Failed to archive product'),
  });
};

export const useReorderProducts = () => {
  return trpc.product.reorder.useMutation({
    onSuccess: () => invalidateProducts(),
    onError: () => toast.error('Failed to reorder products'),
  });
};
