import { useState } from 'react';
import { Tag, X, Loader2, Check } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { trpc } from '@/lib/trpc';

interface CouponInputProps {
  trainerId: string;
  subtotalPence: number;
  onApply: (result: { code: string; discountPence: number; percentOff: number | null; amountOffPence: number | null }) => void;
  onRemove: () => void;
  appliedCode: string | null;
}

export const CouponInput = ({ trainerId, subtotalPence, onApply, onRemove, appliedCode }: CouponInputProps) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validate = trpc.coupon.validate.useQuery(
    { trainerId, code: code.toUpperCase(), subtotalPence },
    { enabled: false }
  );

  const handleApply = async () => {
    if (!code.trim()) return;
    setError(null);
    const result = await validate.refetch();
    if (result.data) {
      onApply({
        code: result.data.code,
        discountPence: result.data.discountPence,
        percentOff: result.data.percentOff,
        amountOffPence: result.data.amountOffPence,
      });
      setCode('');
    } else if (result.error) {
      setError(result.error.message || 'Invalid coupon code');
    }
  };

  if (appliedCode) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-[hsl(var(--muted))] px-3 py-2 text-sm">
        <Tag className="h-3.5 w-3.5 text-green-600" />
        <span className="flex-1 font-medium text-[hsl(var(--foreground))]">{appliedCode}</span>
        <Check className="h-3.5 w-3.5 text-green-600" />
        <button
          onClick={onRemove}
          className="ml-1 rounded-full p-0.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          placeholder="Coupon code"
          className="flex-1 bg-[hsl(var(--background))] border-[hsl(var(--border))] text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleApply}
          disabled={!code.trim() || validate.isFetching}
          className="border-[hsl(var(--border))]"
        >
          {validate.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
        </Button>
      </div>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};
