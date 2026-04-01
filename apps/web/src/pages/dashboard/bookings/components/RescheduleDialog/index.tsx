import { useState, useMemo } from 'react';
import { CalendarClock } from 'lucide-react';
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
import { useRescheduleBooking } from '@/api/booking';
import { DatePicker } from '../../book/components/DatePicker';
import { SlotPicker } from '../../book/components/SlotPicker';

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  trainerId: string;
  durationMin: number;
}

export const RescheduleDialog = ({
  open,
  onOpenChange,
  bookingId,
  trainerId,
  durationMin,
}: RescheduleDialogProps) => {
  const rescheduleMutation = useRescheduleBooking();

  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

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

  const selectedSlotObj = slots?.find((s) => s.startTime === selectedSlot);

  const handleSubmit = () => {
    if (!selectedDate || !selectedSlot || !selectedSlotObj) return;
    rescheduleMutation.mutate(
      {
        id: bookingId,
        date: selectedDate,
        startTime: selectedSlot,
        durationMin: selectedSlotObj.durationMin,
      },
      {
        onSuccess: () => {
          setSelectedDate(null);
          setSelectedSlot(null);
          onOpenChange(false);
        },
      },
    );
  };

  const handleClose = (value: boolean) => {
    if (!value) {
      setSelectedDate(null);
      setSelectedSlot(null);
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Reschedule Session
          </DialogTitle>
          <DialogDescription>
            Pick a new date and time. The other party will need to confirm.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedDate ? (
            <DatePicker
              availableDates={availableDates ?? []}
              selectedDate={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setSelectedSlot(null);
              }}
              month={month}
              onMonthChange={setMonth}
            />
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedDate(null);
                    setSelectedSlot(null);
                  }}
                >
                  Change date
                </Button>
              </div>
              <SlotPicker
                slots={slots ?? []}
                selectedSlot={selectedSlot}
                onSelect={setSelectedSlot}
                isLoading={slotsLoading}
              />
            </div>
          )}
        </div>

        {selectedSlot && selectedDate && (
          <div className="bg-muted rounded-lg px-3 py-2 text-sm">
            New time:{' '}
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })}{' '}
            at {selectedSlot}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedSlot || !selectedDate || rescheduleMutation.isPending}
          >
            {rescheduleMutation.isPending ? 'Rescheduling...' : 'Reschedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
