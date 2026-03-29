import { useState } from 'react';
import { Eye } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { useTrainerOrders } from '@/api/order';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLOURS } from '../../storefront.constants';
import { OrderDetail } from '../OrderDetail';

export const OrderList = () => {
  const { data, isLoading } = useTrainerOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded bg-muted" />;
  }

  const orders = data?.orders;

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No orders yet. Orders will appear here when customers make purchases.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-3 font-medium">Order</th>
              <th className="pb-3 font-medium">Customer</th>
              <th className="pb-3 font-medium">Items</th>
              <th className="pb-3 font-medium">Total</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium sr-only">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b">
                <td className="py-3 font-mono text-xs">{order.id.slice(-8)}</td>
                <td className="py-3">{order.buyer.name ?? order.buyer.email}</td>
                <td className="py-3">
                  {order.items.map((item) => item.product.name).join(', ')}
                </td>
                <td className="py-3 font-medium">
                  £{(order.totalPence / 100).toFixed(2)}
                  {order.coupon && (
                    <span className="text-xs text-muted-foreground block">{order.coupon.code}</span>
                  )}
                </td>
                <td className="py-3">
                  <Badge variant="outline" className={ORDER_STATUS_COLOURS[order.status]}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                </td>
                <td className="py-3 text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedOrderId(order.id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <OrderDetail
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </>
  );
};
