import { cn } from '@/lib/utils';

interface PricingToggleProps {
  billingPeriod: 'MONTHLY' | 'ANNUAL';
  onChange: (period: 'MONTHLY' | 'ANNUAL') => void;
}

export const PricingToggle = ({ billingPeriod, onChange }: PricingToggleProps) => {
  const isAnnual = billingPeriod === 'ANNUAL';

  return (
    <div className="flex items-center justify-center gap-4">
      <span
        className={cn(
          'text-sm font-semibold uppercase tracking-wider cursor-pointer transition-colors',
          !isAnnual ? 'text-white' : 'text-white/50',
        )}
        onClick={() => onChange('MONTHLY')}
      >
        Monthly
      </span>
      <button
        type="button"
        aria-label="Toggle annual pricing"
        onClick={() => onChange(isAnnual ? 'MONTHLY' : 'ANNUAL')}
        className={cn(
          'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
          isAnnual ? 'bg-primary' : 'bg-white/30',
        )}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 rounded-full bg-white transition-transform',
            isAnnual ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </button>
      <span
        className={cn(
          'text-sm font-semibold uppercase tracking-wider cursor-pointer transition-colors',
          isAnnual ? 'text-white' : 'text-white/50',
        )}
        onClick={() => onChange('ANNUAL')}
      >
        Yearly <span className="text-xs font-normal">(2 Months Free)</span>
      </span>
    </div>
  );
};
