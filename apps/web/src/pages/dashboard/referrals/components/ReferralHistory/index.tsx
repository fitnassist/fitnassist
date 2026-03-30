import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import { useReferralHistory } from '@/api/referral';

const STATUS_STYLES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Pending', variant: 'secondary' },
  ACTIVATED: { label: 'Activated', variant: 'default' },
  EXPIRED: { label: 'Expired', variant: 'outline' },
};

export const ReferralHistory = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useReferralHistory({ page, limit: 20 });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </Card>
    );
  }

  if (!data?.items.length) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        <p>No referrals yet. Share your referral link to get started!</p>
      </Card>
    );
  }

  const totalPages = Math.ceil((data.total ?? 0) / (data.limit ?? 20));

  return (
    <Card>
      <div className="p-4 border-b">
        <h3 className="font-semibold">Referral History</h3>
      </div>
      <div className="divide-y">
        {data.items.map((referral) => {
          const statusInfo = STATUS_STYLES[referral.status] ?? { label: 'Unknown', variant: 'outline' as const };
          return (
            <div key={referral.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {referral.referredUser.image ? (
                  <img
                    src={referral.referredUser.image}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    {referral.referredUser.name?.charAt(0) ?? '?'}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">
                    {referral.referredUser.name ?? referral.referredUser.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(referral.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
          );
        })}
      </div>
      {totalPages > 1 && (
        <div className="p-4 border-t flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </Card>
  );
};
