import { trpc } from '@/lib/trpc';
import { queryClient } from '@/lib/queryClient';
import { toast } from '@/lib/toast';

const invalidateOrders = () => {
  queryClient.invalidateQueries({ queryKey: [['order']] });
};

export const useTrainerOrders = () => {
  return trpc.order.trainerOrders.useQuery();
};

export const useBuyerOrders = () => {
  return trpc.order.myOrders.useQuery();
};

export const useCreateOrder = () => {
  return trpc.order.create.useMutation({
    onSuccess: () => invalidateOrders(),
    onError: (err) => toast.error(err.message || 'Failed to create order'),
  });
};

export const useRefundOrder = () => {
  return trpc.order.refund.useMutation({
    onSuccess: () => {
      invalidateOrders();
      toast.success('Order refunded');
    },
    onError: (err) => toast.error(err.message || 'Failed to refund order'),
  });
};

export const useUpdateOrderStatus = () => {
  return trpc.order.updateStatus.useMutation({
    onSuccess: () => {
      invalidateOrders();
      toast.success('Order status updated');
    },
    onError: (err) => toast.error(err.message || 'Failed to update order status'),
  });
};

export const useDownloadUrl = (orderId: string, productId: string) => {
  return trpc.order.getDownloadUrl.useQuery(
    { orderId, productId },
    { enabled: !!orderId && !!productId },
  );
};
