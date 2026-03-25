import { Clock, MapPin, User, MoreVertical, X, Check, AlertTriangle } from 'lucide-react';
import { Button, Badge, Card, CardContent, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui';
import { useState } from 'react';
import { useCancelBooking, useCompleteBooking, useNoShowBooking } from '@/api/booking';

interface BookingCardProps {
  booking: {
    id: string;
    date: string | Date;
    startTime: string;
    endTime: string;
    durationMin: number;
    status: string;
    notes?: string | null;
    cancellationReason?: string | null;
    location?: { name: string; addressLine1?: string | null; city?: string | null } | null;
    clientRoster?: {
      connection?: {
        sender?: { name: string; image?: string | null } | null;
      } | null;
    } | null;
    trainer?: {
      displayName: string;
      profileImageUrl?: string | null;
    } | null;
  };
  isTrainer: boolean;
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info' | 'outline'> = {
  CONFIRMED: 'info',
  COMPLETED: 'success',
  CANCELLED_BY_TRAINER: 'destructive',
  CANCELLED_BY_CLIENT: 'destructive',
  NO_SHOW: 'warning',
};

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED_BY_TRAINER: 'Cancelled',
  CANCELLED_BY_CLIENT: 'Cancelled',
  NO_SHOW: 'No Show',
};

export const BookingCard = ({ booking, isTrainer }: BookingCardProps) => {
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason] = useState('');
  const cancelMutation = useCancelBooking();
  const completeMutation = useCompleteBooking();
  const noShowMutation = useNoShowBooking();

  const clientName = booking.clientRoster?.connection?.sender?.name ?? 'Client';
  const trainerName = booking.trainer?.displayName ?? 'Trainer';
  const dateStr = new Date(booking.date).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const handleCancel = () => {
    cancelMutation.mutate(
      { id: booking.id, reason: cancelReason || undefined },
      { onSuccess: () => setShowCancel(false) }
    );
  };

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">
                  {isTrainer ? clientName : trainerName}
                </span>
                <Badge variant={STATUS_VARIANTS[booking.status] ?? 'secondary'}>
                  {STATUS_LABELS[booking.status] ?? booking.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{dateStr} {booking.startTime} - {booking.endTime}</span>
                <span className="text-xs">({booking.durationMin}min)</span>
              </div>
              {booking.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{booking.location.name}</span>
                </div>
              )}
              {booking.notes && (
                <p className="text-xs text-muted-foreground mt-1">{booking.notes}</p>
              )}
              {booking.cancellationReason && (
                <p className="text-xs text-destructive mt-1">Reason: {booking.cancellationReason}</p>
              )}
            </div>

            {booking.status === 'CONFIRMED' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isTrainer && (
                    <>
                      <DropdownMenuItem onClick={() => completeMutation.mutate({ id: booking.id })}>
                        <Check className="h-4 w-4 mr-2" />
                        Mark Complete
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => noShowMutation.mutate({ id: booking.id })}>
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        No Show
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem onClick={() => setShowCancel(true)} className="text-destructive">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showCancel}
        onOpenChange={setShowCancel}
        title="Cancel Booking"
        description={`Are you sure you want to cancel this booking with ${isTrainer ? clientName : trainerName}?`}
        onConfirm={handleCancel}
        confirmLabel="Cancel Booking"
        variant="destructive"
      />
    </>
  );
};
