import { Calendar, Clock, MapPin, Video } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';

interface BookingConfirmationProps {
  date: string;
  startTime: string;
  durationMin: number;
  sessionType?: string;
  locationName?: string;
  clientAddress?: string;
  notes: string;
  onNotesChange: (notes: string) => void;
  onConfirm: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export const BookingConfirmation = ({
  date,
  startTime,
  durationMin,
  sessionType,
  locationName,
  clientAddress,
  notes,
  onNotesChange,
  onConfirm,
  onBack,
  isSubmitting,
}: BookingConfirmationProps) => {
  const dateStr = new Date(date + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Calculate end time
  const parts = startTime.split(':').map(Number);
  const endMinutes = (parts[0] ?? 0) * 60 + (parts[1] ?? 0) + durationMin;
  const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold">Booking Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{dateStr}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{startTime} - {endTime} ({durationMin} min)</span>
            </div>
            <div className="flex items-center gap-2">
              {sessionType === 'VIDEO_CALL' ? (
                <>
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <span>Video Call</span>
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{locationName || clientAddress || 'No location specified'}</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <label className="text-sm font-medium mb-1 block">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Any notes for the trainer..."
          className="w-full h-20 px-3 py-2 border rounded-lg text-sm resize-none bg-background"
          maxLength={500}
        />
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button onClick={onConfirm} disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Booking...' : 'Confirm Booking'}
        </Button>
      </div>
    </div>
  );
};
