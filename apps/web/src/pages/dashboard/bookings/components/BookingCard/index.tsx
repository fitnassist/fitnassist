import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  MapPin,
  User,
  MoreVertical,
  X,
  Check,
  AlertTriangle,
  CalendarClock,
  MessageSquare,
  ArrowRight,
  Video,
  CreditCard,
  RotateCcw,
  Gift,
} from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  ConfirmDialog,
} from '@/components/ui';
import {
  useCancelBooking,
  useCompleteBooking,
  useNoShowBooking,
  useConfirmBooking,
  useDeclineBooking,
} from '@/api/booking';
import { routes } from '@/config/routes';

interface BookingCardProps {
  booking: {
    id: string;
    date: string | Date;
    startTime: string;
    endTime: string;
    durationMin: number;
    status: string;
    initiatedBy?: string | null;
    sessionType?: string;
    dailyRoomUrl?: string | null;
    notes?: string | null;
    cancellationReason?: string | null;
    declineReason?: string | null;
    rescheduledFrom?: { id: string; date: string | Date; startTime: string } | null;
    rescheduledTo?: { id: string } | null;
    suggestions?: { id: string; status: string }[];
    location?: { name: string; addressLine1?: string | null; city?: string | null } | null;
    clientRoster?: {
      connection?: {
        sender?: { id: string; name: string; image?: string | null } | null;
        senderId?: string | null;
      } | null;
    } | null;
    trainer?: {
      displayName: string;
      profileImageUrl?: string | null;
      userId?: string;
    } | null;
    payment?: {
      id: string;
      status: string;
      amount: number;
      currency: string;
      refundAmount?: number | null;
      refundReason?: string | null;
    } | null;
    isFreeSession?: boolean;
  };
  isTrainer: boolean;
  currentUserId: string;
  onSuggestAlternative?: (bookingId: string) => void;
  onReschedule?: (bookingId: string) => void;
  onViewSuggestions?: (bookingId: string) => void;
}

const STATUS_VARIANTS: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info' | 'outline'
> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  DECLINED: 'destructive',
  RESCHEDULED: 'secondary',
  COMPLETED: 'success',
  CANCELLED_BY_TRAINER: 'destructive',
  CANCELLED_BY_CLIENT: 'destructive',
  NO_SHOW: 'warning',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  DECLINED: 'Declined',
  RESCHEDULED: 'Rescheduled',
  COMPLETED: 'Completed',
  CANCELLED_BY_TRAINER: 'Cancelled',
  CANCELLED_BY_CLIENT: 'Cancelled',
  NO_SHOW: 'No Show',
};

const formatPrice = (amount: number, currency: string = 'gbp') =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: currency.toUpperCase() }).format(
    amount / 100,
  );

const PaymentBadge = ({
  payment,
}: {
  payment: { status: string; amount: number; currency: string; refundAmount?: number | null };
}) => {
  switch (payment.status) {
    case 'SUCCEEDED':
      return (
        <Badge variant="outline" className="gap-1 text-green-700 border-green-300">
          <CreditCard className="h-3 w-3" />
          {formatPrice(payment.amount, payment.currency)}
        </Badge>
      );
    case 'REFUNDED':
      return (
        <Badge variant="outline" className="gap-1 text-orange-700 border-orange-300">
          <RotateCcw className="h-3 w-3" />
          Refunded
        </Badge>
      );
    case 'PARTIALLY_REFUNDED':
      return (
        <Badge variant="outline" className="gap-1 text-orange-700 border-orange-300">
          <RotateCcw className="h-3 w-3" />
          {formatPrice(payment.refundAmount ?? 0, payment.currency)} refunded
        </Badge>
      );
    case 'PENDING':
      return (
        <Badge variant="outline" className="gap-1 text-yellow-700 border-yellow-300">
          <CreditCard className="h-3 w-3" />
          Payment pending
        </Badge>
      );
    case 'FAILED':
      return (
        <Badge variant="destructive" className="gap-1">
          <CreditCard className="h-3 w-3" />
          Payment failed
        </Badge>
      );
    default:
      return null;
  }
};

export const BookingCard = ({
  booking,
  isTrainer,
  currentUserId,
  onSuggestAlternative,
  onReschedule,
  onViewSuggestions,
}: BookingCardProps) => {
  const navigate = useNavigate();
  const [showCancel, setShowCancel] = useState(false);
  const [showDecline, setShowDecline] = useState(false);
  const cancelMutation = useCancelBooking();
  const completeMutation = useCompleteBooking();
  const noShowMutation = useNoShowBooking();
  const confirmMutation = useConfirmBooking();
  const declineMutation = useDeclineBooking();

  const clientName = booking.clientRoster?.connection?.sender?.name ?? 'Client';
  const trainerName = booking.trainer?.displayName ?? 'Trainer';
  const dateStr = new Date(booking.date).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  // Determine if current user is the confirming party (not the initiator)
  const isConfirmingParty = booking.status === 'PENDING' && booking.initiatedBy !== currentUserId;
  const isInitiator = booking.status === 'PENDING' && booking.initiatedBy === currentUserId;
  const pendingSuggestionCount =
    booking.suggestions?.filter((s) => s.status === 'PENDING').length ?? 0;

  const bookingDateIso =
    typeof booking.date === 'string'
      ? booking.date.split('T')[0]
      : new Date(booking.date).toISOString().split('T')[0];
  const isSessionExpired =
    new Date(`${bookingDateIso}T${booking.endTime}:00`).getTime() < Date.now();
  const isCallJoinable =
    new Date(`${bookingDateIso}T${booking.startTime}:00`).getTime() - 5 * 60_000 <= Date.now();

  const handleCancel = () => {
    cancelMutation.mutate({ id: booking.id }, { onSuccess: () => setShowCancel(false) });
  };

  const handleConfirm = () => {
    confirmMutation.mutate({ id: booking.id });
  };

  const handleDecline = () => {
    declineMutation.mutate({ id: booking.id }, { onSuccess: () => setShowDecline(false) });
  };

  return (
    <>
      <Card
        className="cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => navigate(routes.dashboardBookingDetail(booking.id))}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="font-medium text-sm">{isTrainer ? clientName : trainerName}</span>
                <Badge variant={STATUS_VARIANTS[booking.status] ?? 'secondary'}>
                  {STATUS_LABELS[booking.status] ?? booking.status}
                </Badge>
                {booking.sessionType === 'VIDEO_CALL' && (
                  <Badge variant="outline" className="gap-1">
                    <Video className="h-3 w-3" />
                    Video
                  </Badge>
                )}
                {booking.payment && <PaymentBadge payment={booking.payment} />}
                {booking.isFreeSession && !booking.payment && (
                  <Badge variant="outline" className="gap-1 text-green-700 border-green-300">
                    <Gift className="h-3 w-3" />
                    Free
                  </Badge>
                )}
                {isInitiator && booking.status === 'PENDING' && (
                  <span className="text-xs text-muted-foreground">Awaiting confirmation</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {dateStr} {booking.startTime} - {booking.endTime}
                </span>
                <span className="text-xs">({booking.durationMin}min)</span>
              </div>
              {booking.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>{booking.location.name}</span>
                </div>
              )}
              {booking.notes && (
                <p className="text-xs text-muted-foreground mt-1">{booking.notes}</p>
              )}
              {booking.cancellationReason && (
                <p className="text-xs text-destructive mt-1">
                  Reason: {booking.cancellationReason}
                </p>
              )}
              {booking.declineReason && (
                <p className="text-xs text-destructive mt-1">Declined: {booking.declineReason}</p>
              )}
              {booking.rescheduledFrom && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <ArrowRight className="h-3 w-3" />
                  <span>
                    Rescheduled from{' '}
                    {new Date(booking.rescheduledFrom.date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}{' '}
                    at {booking.rescheduledFrom.startTime}
                  </span>
                </div>
              )}
              {booking.rescheduledTo && (
                <p className="text-xs text-muted-foreground mt-1">
                  This booking has been rescheduled
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {/* Join Call button for confirmed video calls (hide if session ended) */}
              {booking.status === 'CONFIRMED' &&
                booking.sessionType === 'VIDEO_CALL' &&
                booking.dailyRoomUrl &&
                !isSessionExpired &&
                (isCallJoinable ? (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => navigate(routes.dashboardBookingCall(booking.id))}
                  >
                    <Video className="h-4 w-4 mr-1" />
                    Join Call
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">Opens 5 min before</span>
                ))}
              {/* Pending: confirm/decline buttons for the confirming party */}
              {isConfirmingParty && (
                <>
                  <Button size="sm" onClick={handleConfirm} disabled={confirmMutation.isPending}>
                    <Check className="h-4 w-4 mr-1" />
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowDecline(true)}
                    disabled={declineMutation.isPending}
                  >
                    Decline
                  </Button>
                  {onSuggestAlternative && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onSuggestAlternative(booking.id)}
                      title="Suggest alternative times"
                    >
                      <CalendarClock className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}

              {/* Pending suggestions badge for the initiator */}
              {isInitiator && pendingSuggestionCount > 0 && onViewSuggestions && (
                <Button size="sm" variant="outline" onClick={() => onViewSuggestions(booking.id)}>
                  <MessageSquare className="h-4 w-4 mr-1" />
                  {pendingSuggestionCount} suggestion{pendingSuggestionCount > 1 ? 's' : ''}
                </Button>
              )}

              {/* Dropdown for confirmed or pending-as-initiator bookings */}
              {(booking.status === 'CONFIRMED' || isInitiator) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {booking.status === 'CONFIRMED' && isTrainer && (
                      <>
                        <DropdownMenuItem
                          onClick={() => completeMutation.mutate({ id: booking.id })}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Mark Complete
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => noShowMutation.mutate({ id: booking.id })}>
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          No Show
                        </DropdownMenuItem>
                      </>
                    )}
                    {booking.status === 'CONFIRMED' && onReschedule && (
                      <DropdownMenuItem onClick={() => onReschedule(booking.id)}>
                        <CalendarClock className="h-4 w-4 mr-2" />
                        Reschedule
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => setShowCancel(true)}
                      className="text-destructive"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
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

      <ConfirmDialog
        open={showDecline}
        onOpenChange={setShowDecline}
        title="Decline Booking"
        description={`Are you sure you want to decline this session request from ${isTrainer ? clientName : trainerName}?`}
        onConfirm={handleDecline}
        confirmLabel="Decline"
        variant="destructive"
      />
    </>
  );
};
