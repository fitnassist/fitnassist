import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Badge, ConfirmDialog } from '@/components/ui';
import { Switch } from '@/components/ui/switch';
import { useCoupons, useUpdateCoupon, useDeleteCoupon } from '@/api/coupon';

interface CouponListProps {
  onCreate: () => void;
}

export const CouponList = ({ onCreate }: CouponListProps) => {
  const { data: coupons, isLoading } = useCoupons();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded bg-muted" />;
  }

  if (!coupons || coupons.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          No coupons yet. Create discount codes your customers can use at checkout.
        </p>
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          {coupons.length} coupon{coupons.length !== 1 ? 's' : ''}
        </p>
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-3 font-medium">Code</th>
              <th className="pb-3 font-medium">Discount</th>
              <th className="pb-3 font-medium">Redemptions</th>
              <th className="pb-3 font-medium">Expires</th>
              <th className="pb-3 font-medium">Active</th>
              <th className="pb-3 font-medium sr-only">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.id} className="border-b">
                <td className="py-3">
                  <Badge variant="outline" className="font-mono">
                    {coupon.code}
                  </Badge>
                  {coupon.description && (
                    <p className="text-xs text-muted-foreground mt-1">{coupon.description}</p>
                  )}
                </td>
                <td className="py-3">
                  {coupon.percentOff
                    ? `${coupon.percentOff}% off`
                    : coupon.amountOffPence
                      ? `£${(coupon.amountOffPence / 100).toFixed(2)} off`
                      : '-'}
                  {coupon.minOrderPence && (
                    <span className="text-xs text-muted-foreground block">
                      Min £{(coupon.minOrderPence / 100).toFixed(2)}
                    </span>
                  )}
                </td>
                <td className="py-3">
                  {coupon.currentRedemptions}
                  {coupon.maxRedemptions ? ` / ${coupon.maxRedemptions}` : ''}
                </td>
                <td className="py-3 text-muted-foreground">
                  {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Never'}
                </td>
                <td className="py-3">
                  <Switch
                    checked={coupon.isActive}
                    onCheckedChange={(checked) =>
                      updateCoupon.mutate({ couponId: coupon.id, isActive: checked })
                    }
                  />
                </td>
                <td className="py-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setConfirmDelete(coupon.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
        title="Deactivate coupon"
        description="This will deactivate the coupon. It can no longer be used for new orders."
        confirmLabel="Deactivate"
        variant="destructive"
        onConfirm={() => {
          if (confirmDelete) deleteCoupon.mutate({ couponId: confirmDelete });
          setConfirmDelete(null);
        }}
        isLoading={deleteCoupon.isPending}
      />
    </>
  );
};
