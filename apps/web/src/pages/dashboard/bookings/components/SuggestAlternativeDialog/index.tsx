import { useState, useMemo } from 'react';
import { CalendarClock, X, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@/components/ui';
import { useAvailableDates, useAvailableSlots } from '@/api/availability';
import { useSuggestAlternative } from '@/api/booking';
import { DatePicker } from '../../book/components/DatePicker';
import { SlotPicker } from '../../book/components/SlotPicker';

interface Suggestion {
  date: string;
  startTime: string;
  endTime: string;
}

interface SuggestAlternativeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  trainerId: string;
  durationMin: number;
}

export const SuggestAlternativeDialog = ({
  open,
  onOpenChange,
  bookingId,
  trainerId,
  durationMin,
}: SuggestAlternativeDialogProps) => {
  const suggestMutation = useSuggestAlternative();

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const startDate = useMemo(() => {
    const d = new Date(month.getFullYear(), month.getMonth(), 1);
    return d.toISOString().split('T')[0]!;
  }, [month]);
  const endDate = useMemo(() => {
    const d = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    return d.toISOString().split('T')[0]!;
  }, [month]);

  const { data: availableDates } = useAvailableDates(trainerId, startDate, endDate, durationMin);
  const { data: slots, isLoading: slotsLoading } = useAvailableSlots(
    trainerId,
    selectedDate ?? '',
    durationMin,
  );

  const handleSlotSelect = (startTime: string) => {
    if (!selectedDate) return;
    const slot = slots?.find((s) => s.startTime === startTime);
    if (!slot) return;

    // Don't add duplicates
    if (suggestions.some((s) => s.date === selectedDate && s.startTime === startTime)) return;

    setSuggestions((prev) => [
      ...prev,
      { date: selectedDate, startTime: slot.startTime, endTime: slot.endTime },
    ]);
    setSelectedDate(null);
  };

  const removeSuggestion = (index: number) => {
    setSuggestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (suggestions.length === 0) return;
    suggestMutation.mutate(
      {
        bookingId,
        suggestions: suggestions.map((s) => ({
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      },
      {
        onSuccess: () => {
          setSuggestions([]);
          setSelectedDate(null);
          onOpenChange(false);
        },
      },
    );
  };

  const handleClose = (value: boolean) => {
    if (!value) {
      setSuggestions([]);
      setSelectedDate(null);
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Suggest Alternative Times
          </DialogTitle>
          <DialogDescription>
            Pick up to 3 alternative time slots from the trainer's availability.
          </DialogDescription>
        </DialogHeader>

        {/* Added suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Your suggestions ({suggestions.length}/3):</p>
            {suggestions.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-muted rounded-lg px-3 py-2"
              >
                <span className="text-sm">
                  {new Date(s.date + 'T00:00:00').toLocaleDateString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}{' '}
                  {s.startTime} - {s.endTime}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => removeSuggestion(i)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Date/slot picker - hidden once at 3 suggestions */}
        {suggestions.length < 3 && (
          <div className="space-y-4">
            {!selectedDate ? (
              <>
                <p className="text-sm text-muted-foreground">
                  {suggestions.length === 0 ? 'Select a date:' : 'Add another suggestion:'}
                </p>
                <DatePicker
                  availableDates={availableDates ?? []}
                  selectedDate={selectedDate}
                  onSelect={setSelectedDate}
                  month={month}
                  onMonthChange={setMonth}
                />
              </>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </h4>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)}>
                    Change date
                  </Button>
                </div>
                <SlotPicker
                  slots={slots ?? []}
                  selectedSlot={null}
                  onSelect={handleSlotSelect}
                  isLoading={slotsLoading}
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={suggestions.length === 0 || suggestMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-1" />
            Send {suggestions.length} Suggestion{suggestions.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
