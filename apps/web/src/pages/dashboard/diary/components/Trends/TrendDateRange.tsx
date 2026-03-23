import { Button } from '@/components/ui';

const RANGES = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
] as const;

interface TrendDateRangeProps {
  selectedDays: number;
  onChange: (days: number) => void;
}

export const TrendDateRange = ({ selectedDays, onChange }: TrendDateRangeProps) => {
  return (
    <div className="flex gap-1.5">
      {RANGES.map(({ label, days }) => (
        <Button
          key={label}
          variant={selectedDays === days ? 'default' : 'outline'}
          size="sm"
          className="h-7 px-2.5 text-xs"
          onClick={() => onChange(days)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
};
