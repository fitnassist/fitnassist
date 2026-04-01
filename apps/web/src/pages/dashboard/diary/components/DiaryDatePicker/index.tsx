import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { prevDay, nextDay, isToday, formatDisplayDate } from '../../diary.utils';

interface DiaryDatePickerProps {
  date: string;
  onChange: (date: string) => void;
}

export const DiaryDatePicker = ({ date, onChange }: DiaryDatePickerProps) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <Button variant="outline" size="icon" onClick={() => onChange(prevDay(date))}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="text-center">
        <p className="text-sm font-medium sm:text-base">{formatDisplayDate(date)}</p>
        {isToday(date) && <p className="text-xs text-muted-foreground">Today</p>}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onChange(nextDay(date))}
        disabled={isToday(date)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
