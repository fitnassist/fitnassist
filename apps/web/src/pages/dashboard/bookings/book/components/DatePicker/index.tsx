import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  availableDates: string[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
  month: Date;
  onMonthChange: (month: Date) => void;
}

export const DatePicker = ({
  availableDates,
  selectedDate,
  onSelect,
  month,
  onMonthChange,
}: DatePickerProps) => {
  const availableSet = useMemo(() => new Set(availableDates), [availableDates]);

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  // Adjust to Monday start
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const today = new Date().toISOString().split('T')[0];

  const prevMonth = () => {
    const prev = new Date(month);
    prev.setMonth(prev.getMonth() - 1);
    onMonthChange(prev);
  };

  const nextMonth = () => {
    const next = new Date(month);
    next.setMonth(next.getMonth() + 1);
    onMonthChange(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium">
          {month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
        </span>
        <Button variant="ghost" size="sm" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="text-xs font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}

        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isAvailable = availableSet.has(dateStr);
          const isSelected = dateStr === selectedDate;
          const isPast = dateStr < (today ?? '');

          return (
            <button
              key={day}
              type="button"
              disabled={!isAvailable || isPast}
              onClick={() => onSelect(dateStr)}
              className={cn(
                'h-9 w-9 rounded-full text-sm mx-auto flex items-center justify-center transition-colors',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : isAvailable && !isPast
                    ? 'hover:bg-primary/10 text-foreground font-medium'
                    : 'text-muted-foreground/40 cursor-not-allowed',
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};
