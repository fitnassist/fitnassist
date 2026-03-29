import { trpc } from '@/lib/trpc';
import { queryClient } from '@/lib/queryClient';
import { toast } from '@/lib/toast';

const invalidateCoupons = () => {
  queryClient.invalidateQueries({ queryKey: [['coupon']] });
};

export const useCoupons = () => {
  return trpc.coupon.list.useQuery();
};

export const useCreateCoupon = () => {
  return trpc.coupon.create.useMutation({
    onSuccess: () => {
      invalidateCoupons();
      toast.success('Coupon created');
    },
    onError: (err) => toast.error(err.message || 'Failed to create coupon'),
  });
};

export const useUpdateCoupon = () => {
  return trpc.coupon.update.useMutation({
    onSuccess: () => {
      invalidateCoupons();
      toast.success('Coupon updated');
    },
    onError: (err) => toast.error(err.message || 'Failed to update coupon'),
  });
};

export const useDeleteCoupon = () => {
  return trpc.coupon.delete.useMutation({
    onSuccess: () => {
      invalidateCoupons();
      toast.success('Coupon deactivated');
    },
    onError: (err) => toast.error(err.message || 'Failed to delete coupon'),
  });
};
