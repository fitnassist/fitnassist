import { Calendar, Clock, MapPin, Video, CreditCard, Gift } from 'lucide-react';
import { Button, Card, CardContent, Badge, Switch, Label } from '@/components/ui';

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
  paymentInfo?: {
    amount: number;
    currency: string;
  } | null;
  isFirstFree?: boolean;
  isFreeSession?: boolean;
  onFreeSessionChange?: (free: boolean) => void;
}

const formatPrice = (amount: number, currency: string = 'gbp') => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

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
  paymentInfo,
  isFirstFree,
  isFreeSession,
  onFreeSessionChange,
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

  const showPayment = paymentInfo || isFirstFree;

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
              <span>
                {startTime} - {endTime} ({durationMin} min)
              </span>
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
            {showPayment && !isFreeSession && (
              <div className="flex items-center gap-2">
                {isFirstFree ? (
                  <>
                    <Gift className="h-4 w-4 text-green-600" />
                    <Badge variant="success" className="text-xs">
                      First Session Free
                    </Badge>
                  </>
                ) : paymentInfo ? (
                  <>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span>{formatPrice(paymentInfo.amount, paymentInfo.currency)}</span>
                  </>
                ) : null}
              </div>
            )}
            {isFreeSession && (
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-green-600" />
                <Badge variant="success" className="text-xs">
                  Free Session
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {onFreeSessionChange && paymentInfo && !isFirstFree && (
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <Label htmlFor="free-session">Free session</Label>
            <p className="text-xs text-muted-foreground">
              No payment will be required for this session
            </p>
          </div>
          <Switch
            id="free-session"
            checked={isFreeSession ?? false}
            onCheckedChange={onFreeSessionChange}
          />
        </div>
      )}

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
          {isSubmitting
            ? 'Booking...'
            : paymentInfo && !isFirstFree && !isFreeSession
              ? `Confirm & Pay ${formatPrice(paymentInfo.amount, paymentInfo.currency)}`
              : 'Confirm Booking'}
        </Button>
      </div>
    </div>
  );
};
