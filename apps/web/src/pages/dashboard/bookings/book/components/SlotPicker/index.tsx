import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface Slot {
  startTime: string;
  endTime: string;
  durationMin: number;
}

interface SlotPickerProps {
  slots: Slot[];
  selectedSlot: string | null;
  onSelect: (startTime: string) => void;
  isLoading?: boolean;
}

export const SlotPicker = ({ slots, selectedSlot, onSelect, isLoading }: SlotPickerProps) => {
  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading available times...</div>;
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No available slots for this date.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map((slot) => (
        <button
          key={slot.startTime}
          type="button"
          onClick={() => onSelect(slot.startTime)}
          className={cn(
            'px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
            selectedSlot === slot.startTime
              ? 'bg-primary text-primary-foreground border-primary'
              : 'hover:bg-primary/5 hover:border-primary/30',
          )}
        >
          {slot.startTime}
        </button>
      ))}
    </div>
  );
};
