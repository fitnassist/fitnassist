import { cn } from '@/lib/utils';

interface PricingToggleProps {
  billingPeriod: 'MONTHLY' | 'ANNUAL';
  onChange: (period: 'MONTHLY' | 'ANNUAL') => void;
}

export const PricingToggle = ({ billingPeriod, onChange }: PricingToggleProps) => {
  return (
    <div className="flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => onChange('MONTHLY')}
        className={cn(
          'px-4 py-2 rounded-full text-sm font-medium transition-colors',
          billingPeriod === 'MONTHLY'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange('ANNUAL')}
        className={cn(
          'px-4 py-2 rounded-full text-sm font-medium transition-colors',
          billingPeriod === 'ANNUAL'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        Annual
        <span className="ml-1.5 text-xs opacity-80">Save ~17%</span>
      </button>
    </div>
  );
};
