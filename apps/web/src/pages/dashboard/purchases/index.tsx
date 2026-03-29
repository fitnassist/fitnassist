import { useState } from 'react';
import { Package, Download, ExternalLink, Loader2 } from 'lucide-react';
import { Button, Skeleton, Badge } from '@/components/ui';
import { useBuyerOrders } from '@/api/order';
import { trpc } from '@/lib/trpc';
import type { OrderStatus } from '@fitnassist/database';

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Pending',
  PAID: 'Paid',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  REFUNDED: 'Refunded',
  CANCELLED: 'Cancelled',
};

const ORDER_STATUS_VARIANTS: Record<OrderStatus, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  PENDING_PAYMENT: 'warning',
  PAID: 'default',
  PROCESSING: 'secondary',
  SHIPPED: 'default',
  DELIVERED: 'success',
  REFUNDED: 'destructive',
  CANCELLED: 'outline',
};

const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const formatPrice = (pence: number) => `£${(pence / 100).toFixed(2)}`;

const DownloadButton = ({ orderId, productId, productName }: { orderId: string; productId: string; productName: string }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const downloadQuery = trpc.order.getDownloadUrl.useQuery(
    { orderId, productId },
    { enabled: false }
  );

  const handleDownload = async () => {
    setIsDownloading(true);
    const result = await downloadQuery.refetch();
    if (result.data?.url) {
      const link = document.createElement('a');
      link.href = result.data.url;
      link.download = result.data.fileName || productName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setIsDownloading(false);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} disabled={isDownloading}>
      {isDownloading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
      Download
    </Button>
  );
};

export const PurchasesPage = () => {
  const { data, isLoading } = useBuyerOrders();
  const orders = data?.orders ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">My Purchases</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View your order history and download digital products.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <Package className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No purchases yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Products you buy from trainers will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-lg border bg-card p-4 space-y-3"
            >
              {/* Order header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Order #{order.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={ORDER_STATUS_VARIANTS[order.status as OrderStatus]}>
                    {ORDER_STATUS_LABELS[order.status as OrderStatus]}
                  </Badge>
                  <span className="font-semibold">{formatPrice(order.totalPence)}</span>
                </div>
              </div>

              {/* Trainer */}
              <div className="text-sm text-muted-foreground">
                From <span className="font-medium text-foreground">{order.trainer.displayName}</span>
                {order.trainer.handle && (
                  <a
                    href={`/site/${order.trainer.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center ml-1 text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3 ml-0.5" />
                  </a>
                )}
              </div>

              {/* Items */}
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.productName}
                        className="h-12 w-12 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(item.pricePence)} x {item.quantity}
                      </p>
                    </div>
                    {item.product.type === 'DIGITAL' &&
                      (order.status === 'PAID' || order.status === 'DELIVERED') && (
                        <DownloadButton
                          orderId={order.id}
                          productId={item.product.id}
                          productName={item.productName}
                        />
                      )}
                  </div>
                ))}
              </div>

              {/* Discount info */}
              {order.discountPence > 0 && (
                <div className="text-xs text-muted-foreground border-t pt-2">
                  Discount applied: -{formatPrice(order.discountPence)}
                  {order.couponCode && <span className="ml-1">({order.couponCode})</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
