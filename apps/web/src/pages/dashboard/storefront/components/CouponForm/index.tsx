import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button, Input, Label, Textarea } from '@/components/ui';
import { useCreateCoupon } from '@/api/coupon';
import { createCouponSchema, type CreateCouponInput } from '@fitnassist/schemas';

interface CouponFormProps {
  onBack: () => void;
}

export const CouponForm = ({ onBack }: CouponFormProps) => {
  const createCoupon = useCreateCoupon();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateCouponInput>({
    resolver: zodResolver(createCouponSchema),
    defaultValues: {
      code: '',
      description: '',
      discountType: 'PERCENT',
    },
  });

  const discountType = watch('discountType');

  const onSubmit = (data: CreateCouponInput) => {
    createCoupon.mutate(data, { onSuccess: onBack });
  };

  return (
    <div>
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to coupons
      </Button>

      <h2 className="text-xl font-semibold mb-6">Create Coupon</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
        <div className="space-y-2">
          <Label htmlFor="code">Coupon Code</Label>
          <Input id="code" {...register('code')} placeholder="e.g. SUMMER20" className="uppercase" />
          {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
          <p className="text-xs text-muted-foreground">Customers enter this at checkout. Auto-uppercase, no spaces.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (internal)</Label>
          <Textarea id="description" {...register('description')} placeholder="e.g. Summer sale 2026" rows={2} />
        </div>

        <div className="space-y-2">
          <Label>Discount Type</Label>
          <div className="flex gap-4">
            {(['PERCENT', 'FIXED'] as const).map((t) => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value={t} {...register('discountType')} className="accent-primary" />
                <span className="text-sm">{t === 'PERCENT' ? 'Percentage' : 'Fixed Amount'}</span>
              </label>
            ))}
          </div>
        </div>

        {discountType === 'PERCENT' ? (
          <div className="space-y-2">
            <Label htmlFor="percentOff">Percentage Off</Label>
            <Input id="percentOff" type="number" {...register('percentOff', { valueAsNumber: true })} placeholder="e.g. 20" min={1} max={100} />
            {errors.percentOff && <p className="text-sm text-destructive">{errors.percentOff.message}</p>}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="amountOffPence">Amount Off (pence)</Label>
            <Input id="amountOffPence" type="number" {...register('amountOffPence', { valueAsNumber: true })} placeholder="e.g. 500 for £5.00" min={1} />
            {errors.amountOffPence && <p className="text-sm text-destructive">{errors.amountOffPence.message}</p>}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="minOrderPence">Minimum Order (pence, optional)</Label>
          <Input id="minOrderPence" type="number" {...register('minOrderPence', { valueAsNumber: true })} placeholder="e.g. 2000 for £20 minimum" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxRedemptions">Max Redemptions (optional)</Label>
          <Input id="maxRedemptions" type="number" {...register('maxRedemptions', { valueAsNumber: true })} placeholder="Leave empty for unlimited" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiresAt">Expiry Date (optional)</Label>
          <Input id="expiresAt" type="datetime-local" {...register('expiresAt')} />
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={createCoupon.isPending}>
            {createCoupon.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Coupon
          </Button>
          <Button type="button" variant="outline" onClick={onBack}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};
