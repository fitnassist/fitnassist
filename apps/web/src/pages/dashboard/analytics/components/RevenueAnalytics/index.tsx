import { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { ChevronDown, ShoppingBag, Video } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@/components/ui';
import {
  useRevenueAnalytics,
  useRevenueTransactions,
  useProductOrderTransactions,
} from '@/api/analytics';

const formatPence = (pence: number) => {
  return `£${(pence / 100).toFixed(2)}`;
};

const sessionStatusVariant = (
  status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'SUCCEEDED':
      return 'default';
    case 'REFUNDED':
      return 'destructive';
    case 'PARTIALLY_REFUNDED':
      return 'secondary';
    default:
      return 'outline';
  }
};

const sessionStatusLabel = (status: string) => {
  switch (status) {
    case 'SUCCEEDED':
      return 'Paid';
    case 'REFUNDED':
      return 'Refunded';
    case 'PARTIALLY_REFUNDED':
      return 'Partial Refund';
    case 'PENDING':
      return 'Pending';
    default:
      return status;
  }
};

const orderStatusVariant = (
  status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'PAID':
    case 'DELIVERED':
      return 'default';
    case 'PROCESSING':
    case 'SHIPPED':
      return 'secondary';
    case 'REFUNDED':
      return 'destructive';
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'outline';
  }
};

const orderStatusLabel = (status: string) => {
  switch (status) {
    case 'PAID':
      return 'Paid';
    case 'PROCESSING':
      return 'Processing';
    case 'SHIPPED':
      return 'Shipped';
    case 'DELIVERED':
      return 'Delivered';
    case 'REFUNDED':
      return 'Refunded';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
};

export const RevenueAnalytics = () => {
  const { data: analytics, isLoading: analyticsLoading } = useRevenueAnalytics();
  const [activeSection, setActiveSection] = useState<'sessions' | 'products'>('sessions');

  const chartData = (analytics?.weeklyRevenue ?? []).map((d) => ({
    week: format(new Date(d.week + 'T00:00:00'), 'MMM d'),
    sessions: d.sessionRevenue / 100,
    products: d.productRevenue / 100,
    refunds: d.refunds / 100,
  }));

  const summary = analytics?.summary;
  const hasProductData =
    (summary?.totalOrders30d ?? 0) > 0 || (summary?.totalProductRevenue30d ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {analyticsLoading ? (
            <div className="h-[300px] animate-pulse rounded bg-muted" />
          ) : chartData.length === 0 && !summary?.totalSessions30d && !summary?.totalOrders30d ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No payment data yet. Revenue will appear here once sessions are paid or products are
              sold.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{formatPence(summary?.totalRevenue30d ?? 0)}</p>
                  <p className="text-xs text-muted-foreground">Total Revenue (30d)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{summary?.totalSessions30d ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Paid Sessions (30d)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{summary?.totalOrders30d ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Product Orders (30d)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{formatPence(summary?.totalRefunds30d ?? 0)}</p>
                  <p className="text-xs text-muted-foreground">Refunds (30d)</p>
                </div>
              </div>

              {/* Secondary stats */}
              <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
                <div className="text-center">
                  <p className="text-lg font-semibold">
                    {formatPence(summary?.avgSessionPrice ?? 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Avg Session Price</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">
                    {formatPence(
                      (summary?.totalRevenue30d ?? 0) - (summary?.totalProductRevenue30d ?? 0),
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">Session Revenue (30d)</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">
                    {formatPence(summary?.totalProductRevenue30d ?? 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Product Revenue (30d)</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">
                    {formatPence(summary?.avgOrderValue ?? 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Avg Order Value</p>
                </div>
              </div>

              {chartData.length > 0 && (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      tickFormatter={(v) => `£${v}`}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      formatter={(value) => [`£${Number(value).toFixed(2)}`]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar
                      dataKey="sessions"
                      name="Sessions"
                      fill="hsl(170, 58%, 50%)"
                      radius={[4, 4, 0, 0]}
                      stackId="revenue"
                    />
                    {hasProductData && (
                      <Bar
                        dataKey="products"
                        name="Products"
                        fill="hsl(210, 58%, 55%)"
                        radius={[4, 4, 0, 0]}
                        stackId="revenue"
                      />
                    )}
                    <Bar
                      dataKey="refunds"
                      name="Refunds"
                      fill="hsl(0, 50%, 65%)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Transaction Section Toggle */}
      <div className="flex gap-2">
        <Button
          variant={activeSection === 'sessions' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveSection('sessions')}
        >
          <Video className="mr-1.5 h-4 w-4" />
          Session Payments
        </Button>
        <Button
          variant={activeSection === 'products' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveSection('products')}
        >
          <ShoppingBag className="mr-1.5 h-4 w-4" />
          Product Orders
        </Button>
      </div>

      {activeSection === 'sessions' ? <SessionTransactions /> : <ProductOrderTransactions />}
    </div>
  );
};

/* ── Session Transactions ─────────────────────────────────────── */

interface SessionTransaction {
  id: string;
  amount: number;
  platformFee: number;
  netAmount: number;
  currency: string;
  status: string;
  refundAmount: number | null;
  refundReason: string | null;
  refundedAt: Date | null;
  paidAt: Date;
  clientName: string;
  clientImage: string | null | undefined;
  bookingDate: Date;
  startTime: string;
}

const SessionTransactions = () => {
  const {
    data: transactionsData,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useRevenueTransactions();

  const transactions = transactionsData?.pages.flatMap((p) => p.items) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Payments</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No session payments yet</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((t) => (
              <SessionTransactionRow key={t.id} transaction={t} />
            ))}

            {hasNextPage && (
              <div className="pt-2 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? 'Loading...' : 'Load More'}
                  {!isFetchingNextPage && <ChevronDown className="ml-1 h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const SessionTransactionRow = ({ transaction: t }: { transaction: SessionTransaction }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border p-3">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {t.clientImage ? (
            <img
              src={t.clientImage}
              alt=""
              className="h-8 w-8 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
              {t.clientName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{t.clientName}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(t.bookingDate), 'MMM d, yyyy')} at {t.startTime}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={sessionStatusVariant(t.status)}>{sessionStatusLabel(t.status)}</Badge>
          <span className="text-sm font-semibold">{formatPence(t.netAmount)}</span>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 border-t pt-3 text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Session price</span>
            <span>{formatPence(t.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Platform fee</span>
            <span>-{formatPence(t.platformFee)}</span>
          </div>
          <div className="flex justify-between font-medium text-foreground">
            <span>Your earnings</span>
            <span>{formatPence(t.netAmount)}</span>
          </div>
          {t.refundAmount != null && t.refundAmount > 0 && (
            <>
              <div className="flex justify-between text-destructive">
                <span>Refund</span>
                <span>-{formatPence(t.refundAmount)}</span>
              </div>
              {t.refundReason && <p className="text-destructive">Reason: {t.refundReason}</p>}
            </>
          )}
          <p>Paid {format(new Date(t.paidAt), "MMM d, yyyy 'at' h:mm a")}</p>
        </div>
      )}
    </div>
  );
};

/* ── Product Order Transactions ───────────────────────────────── */

interface ProductOrder {
  id: string;
  totalPence: number;
  platformFeePence: number;
  netAmount: number;
  discountPence: number;
  currency: string;
  status: string;
  refundAmount: number | null;
  refundReason: string | null;
  refundedAt: Date | null;
  paidAt: Date;
  buyerName: string;
  buyerImage: string | null | undefined;
  items: Array<{ productName: string; quantity: number; pricePence: number }>;
  couponCode: string | null;
}

const ProductOrderTransactions = () => {
  const {
    data: ordersData,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useProductOrderTransactions();

  const orders = ordersData?.pages.flatMap((p) => p.items) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Orders</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No product orders yet</p>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => (
              <ProductOrderRow key={o.id} order={o} />
            ))}

            {hasNextPage && (
              <div className="pt-2 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? 'Loading...' : 'Load More'}
                  {!isFetchingNextPage && <ChevronDown className="ml-1 h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ProductOrderRow = ({ order: o }: { order: ProductOrder }) => {
  const [expanded, setExpanded] = useState(false);
  const firstItem = o.items[0];
  const itemSummary =
    o.items.length === 1 && firstItem
      ? `${firstItem.productName} x${firstItem.quantity}`
      : `${o.items.length} items`;

  return (
    <div className="rounded-lg border p-3">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {o.buyerImage ? (
            <img src={o.buyerImage} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
              {o.buyerName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{o.buyerName}</p>
            <p className="text-xs text-muted-foreground">{itemSummary}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={orderStatusVariant(o.status)}>{orderStatusLabel(o.status)}</Badge>
          <span className="text-sm font-semibold">{formatPence(o.netAmount)}</span>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 border-t pt-3 text-xs text-muted-foreground space-y-1">
          {o.items.map((item, i) => (
            <div key={i} className="flex justify-between">
              <span>
                {item.productName} x{item.quantity}
              </span>
              <span>{formatPence(item.pricePence * item.quantity)}</span>
            </div>
          ))}
          {o.discountPence > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount{o.couponCode ? ` (${o.couponCode})` : ''}</span>
              <span>-{formatPence(o.discountPence)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Order total</span>
            <span>{formatPence(o.totalPence)}</span>
          </div>
          <div className="flex justify-between">
            <span>Platform fee</span>
            <span>-{formatPence(o.platformFeePence)}</span>
          </div>
          <div className="flex justify-between font-medium text-foreground">
            <span>Your earnings</span>
            <span>{formatPence(o.netAmount)}</span>
          </div>
          {o.refundAmount != null && o.refundAmount > 0 && (
            <>
              <div className="flex justify-between text-destructive">
                <span>Refund</span>
                <span>-{formatPence(o.refundAmount)}</span>
              </div>
              {o.refundReason && <p className="text-destructive">Reason: {o.refundReason}</p>}
            </>
          )}
          <p>Paid {format(new Date(o.paidAt), "MMM d, yyyy 'at' h:mm a")}</p>
        </div>
      )}
    </div>
  );
};
