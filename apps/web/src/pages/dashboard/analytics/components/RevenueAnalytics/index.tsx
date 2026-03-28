import { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@/components/ui';
import { useRevenueAnalytics, useRevenueTransactions } from '@/api/analytics';

const formatPence = (pence: number) => {
  return `£${(pence / 100).toFixed(2)}`;
};

const statusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'SUCCEEDED': return 'default';
    case 'REFUNDED': return 'destructive';
    case 'PARTIALLY_REFUNDED': return 'secondary';
    default: return 'outline';
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'SUCCEEDED': return 'Paid';
    case 'REFUNDED': return 'Refunded';
    case 'PARTIALLY_REFUNDED': return 'Partial Refund';
    case 'PENDING': return 'Pending';
    default: return status;
  }
};

export const RevenueAnalytics = () => {
  const { data: analytics, isLoading: analyticsLoading } = useRevenueAnalytics();
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useRevenueTransactions();

  const chartData = (analytics?.weeklyRevenue ?? []).map((d) => ({
    week: format(new Date(d.week + 'T00:00:00'), 'MMM d'),
    revenue: d.revenue / 100,
    refunds: d.refunds / 100,
  }));

  const transactions = transactionsData?.pages.flatMap((p) => p.items) ?? [];
  const summary = analytics?.summary;

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
          ) : chartData.length === 0 && !summary?.totalSessions30d ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No payment data yet. Revenue will appear here once sessions are paid.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{formatPence(summary?.totalRevenue30d ?? 0)}</p>
                  <p className="text-xs text-muted-foreground">Revenue (30d)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{formatPence(summary?.avgSessionPrice ?? 0)}</p>
                  <p className="text-xs text-muted-foreground">Avg Session</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{summary?.totalSessions30d ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Paid Sessions (30d)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{formatPence(summary?.totalRefunds30d ?? 0)}</p>
                  <p className="text-xs text-muted-foreground">Refunds (30d)</p>
                </div>
              </div>

              {chartData.length > 0 && (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      tickFormatter={(v) => `£${v}`}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      formatter={(value) => [`£${Number(value).toFixed(2)}`]}
                    />
                    <Bar dataKey="revenue" name="Revenue" fill="hsl(170, 58%, 50%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="refunds" name="Refunds" fill="hsl(0, 50%, 65%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No transactions yet
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.map((t) => (
                <TransactionRow key={t.id} transaction={t} />
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
    </div>
  );
};

interface Transaction {
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

const TransactionRow = ({ transaction: t }: { transaction: Transaction }) => {
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
            <img src={t.clientImage} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
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
          <Badge variant={statusVariant(t.status)}>{statusLabel(t.status)}</Badge>
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
              {t.refundReason && (
                <p className="text-destructive">Reason: {t.refundReason}</p>
              )}
            </>
          )}
          <p>Paid {format(new Date(t.paidAt), 'MMM d, yyyy \'at\' h:mm a')}</p>
        </div>
      )}
    </div>
  );
};
