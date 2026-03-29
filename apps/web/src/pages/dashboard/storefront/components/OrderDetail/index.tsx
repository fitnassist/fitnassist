import { useState } from 'react';
import { Package, Truck, CheckCircle, RefreshCw } from 'lucide-react';
import { Button, Badge, ConfirmDialog } from '@/components/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRefundOrder, useUpdateOrderStatus } from '@/api/order';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLOURS } from '../../storefront.constants';
import type { OrderStatus } from '@fitnassist/database';

interface OrderDetailProps {
  orderId: string | null;
  onClose: () => void;
}

// We use the trainerOrders data rather than a separate query since it includes all needed fields
import { useTrainerOrders } from '@/api/order';

export const OrderDetail = ({ orderId, onClose }: OrderDetailProps) => {
  const { data } = useTrainerOrders();
  const refundOrder = useRefundOrder();
  const updateStatus = useUpdateOrderStatus();
  const [showRefund, setShowRefund] = useState(false);

  const order = data?.orders.find((o) => o.id === orderId);

  if (!orderId || !order) return null;

  const canRefund = order.status !== 'REFUNDED' && order.status !== 'CANCELLED' && order.status !== 'PENDING_PAYMENT';
  const canUpdateStatus = ['PAID', 'PROCESSING', 'SHIPPED'].includes(order.status);

  const nextStatusMap: Partial<Record<OrderStatus, { status: 'PROCESSING' | 'SHIPPED' | 'DELIVERED'; label: string; icon: typeof Package }>> = {
    PAID: { status: 'PROCESSING', label: 'Mark Processing', icon: Package },
    PROCESSING: { status: 'SHIPPED', label: 'Mark Shipped', icon: Truck },
    SHIPPED: { status: 'DELIVERED', label: 'Mark Delivered', icon: CheckCircle },
  };

  const nextAction = nextStatusMap[order.status];

  return (
    <>
      <Dialog open={!!orderId} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Order #{order.id.slice(-8)}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={ORDER_STATUS_COLOURS[order.status]}>
                {ORDER_STATUS_LABELS[order.status]}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Customer */}
            <div>
              <h4 className="text-sm font-medium mb-1">Customer</h4>
              <p className="text-sm">{order.buyer.name}</p>
              <p className="text-sm text-muted-foreground">{order.buyer.email}</p>
            </div>

            {/* Items */}
            <div>
              <h4 className="text-sm font-medium mb-2">Items</h4>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {item.product.imageUrl && (
                        <img src={item.product.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                      )}
                      <span>{item.productName} x{item.quantity}</span>
                    </div>
                    <span>£{(item.pricePence * item.quantity / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t pt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>£{(order.subtotalPence / 100).toFixed(2)}</span>
              </div>
              {order.discountPence > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                  <span>-£{(order.discountPence / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>£{(order.totalPence / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Platform fee (3%)</span>
                <span>-£{(order.platformFeePence / 100).toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {canUpdateStatus && nextAction && (
                <Button
                  size="sm"
                  onClick={() => updateStatus.mutate({ orderId: order.id, status: nextAction.status })}
                  disabled={updateStatus.isPending}
                >
                  <nextAction.icon className="h-4 w-4 mr-2" />
                  {nextAction.label}
                </Button>
              )}
              {canRefund && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  onClick={() => setShowRefund(true)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refund
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showRefund}
        onOpenChange={setShowRefund}
        title="Refund order"
        description={`Refund £${(order.totalPence / 100).toFixed(2)} to ${order.buyer.name ?? 'the customer'}? This cannot be undone.`}
        confirmLabel="Refund"
        variant="destructive"
        onConfirm={() => {
          refundOrder.mutate({ orderId: order.id });
          setShowRefund(false);
          onClose();
        }}
        isLoading={refundOrder.isPending}
      />
    </>
  );
};
