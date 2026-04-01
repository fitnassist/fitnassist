import { useState } from 'react';
import { ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';
import { Badge, Button, Card, CardContent, Skeleton } from '@/components/ui';
import { useReferralHistory } from '@/api/referral';

const STATUS_STYLES: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  PENDING: { label: 'Pending', variant: 'secondary' },
  ACTIVATED: { label: 'Activated', variant: 'default' },
  EXPIRED: { label: 'Expired', variant: 'outline' },
};

export const ReferralHistory = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useReferralHistory({ page, limit: 20 });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data?.items.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">No referrals yet</h3>
            <p className="text-muted-foreground text-sm">
              Share your referral link with other trainers to get started!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalPages = Math.ceil((data.total ?? 0) / (data.limit ?? 20));

  return (
    <Card>
      <div className="px-6 py-4 border-b">
        <h3 className="font-semibold">Referral History</h3>
      </div>
      <CardContent className="p-0">
        <div className="divide-y">
          {data.items.map((referral) => {
            const statusInfo = STATUS_STYLES[referral.status] ?? {
              label: 'Unknown',
              variant: 'outline' as const,
            };
            return (
              <div key={referral.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {referral.referredUser.image ? (
                    <img
                      src={referral.referredUser.image}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
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
          <div className="px-6 py-4 border-t flex items-center justify-between">
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
      </CardContent>
    </Card>
  );
};
