import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, User, Check, X, CalendarClock, ArrowRight, AlertTriangle, MoreVertical, Video,
} from 'lucide-react';
import {
  Button, Badge, Card, CardContent, ConfirmDialog,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui';
import { PageLayout } from '@/components/layouts';
import { useAuth } from '@/hooks';
import {
  useBooking, useConfirmBooking, useDeclineBooking, useCancelBooking,
  useCompleteBooking, useNoShowBooking,
} from '@/api/booking';
import { routes } from '@/config/routes';
import { SuggestionsList } from '../components/SuggestionsList';
import { SuggestAlternativeDialog } from '../components/SuggestAlternativeDialog';

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info' | 'outline'> = {
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

export const BookingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isTrainer } = useAuth();
  const { data: booking, isLoading } = useBooking(id ?? '');

  const confirmMutation = useConfirmBooking();
  const declineMutation = useDeclineBooking();
  const cancelMutation = useCancelBooking();
  const completeMutation = useCompleteBooking();
  const noShowMutation = useNoShowBooking();

  const [showCancel, setShowCancel] = useState(false);
  const [showDecline, setShowDecline] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);

  if (isLoading) {
    return (
      <PageLayout>
        <PageLayout.Header
          title="Booking Details"
          icon={<Calendar className="h-6 w-6 sm:h-8 sm:w-8" />}
          backLink={{ label: 'Back to bookings', to: routes.dashboardBookings }}
        />
        <PageLayout.Content>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </PageLayout.Content>
      </PageLayout>
    );
  }

  if (!booking) {
    return (
      <PageLayout>
        <PageLayout.Header
          title="Booking Not Found"
          icon={<Calendar className="h-6 w-6 sm:h-8 sm:w-8" />}
          backLink={{ label: 'Back to bookings', to: routes.dashboardBookings }}
        />
        <PageLayout.Content>
          <p className="text-muted-foreground">This booking doesn't exist or you don't have access.</p>
        </PageLayout.Content>
      </PageLayout>
    );
  }

  const currentUserId = user?.id ?? '';
  const isConfirmingParty = booking.status === 'PENDING' && booking.initiatedBy !== currentUserId;
  const isInitiator = booking.status === 'PENDING' && booking.initiatedBy === currentUserId;

  const clientName = booking.clientRoster?.connection?.sender?.name ?? 'Client';
  const trainerName = booking.trainer?.displayName ?? 'Trainer';
  const otherPartyName = isTrainer ? clientName : trainerName;
  const trainerId = booking.trainer?.id ?? '';

  const dateStr = new Date(booking.date).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const bookingDateIso = new Date(booking.date).toISOString().split('T')[0];
  const isSessionExpired = new Date(`${bookingDateIso}T${booking.endTime}:00`).getTime() < Date.now();

  return (
    <PageLayout>
      <PageLayout.Header
        title="Booking Details"
        icon={<Calendar className="h-6 w-6 sm:h-8 sm:w-8" />}
        backLink={{ label: 'Back to bookings', to: routes.dashboardBookings }}
        action={
          (booking.status === 'CONFIRMED' || booking.status === 'PENDING') ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {booking.status === 'CONFIRMED' && isTrainer && (
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
                  Cancel Booking
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : undefined
        }
      />
      <PageLayout.Content>
        <div className="space-y-6 max-w-2xl">
          {/* Status + party */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{otherPartyName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_VARIANTS[booking.status] ?? 'secondary'} className="text-sm">
                    {STATUS_LABELS[booking.status] ?? booking.status}
                  </Badge>
                  {booking.sessionType === 'VIDEO_CALL' && (
                    <Badge variant="outline" className="gap-1">
                      <Video className="h-3 w-3" />
                      Video Call
                    </Badge>
                  )}
                </div>
              </div>

              {isInitiator && (
                <p className="text-sm text-muted-foreground">Awaiting confirmation from {otherPartyName}</p>
              )}

              <div className="grid gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{dateStr}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{booking.startTime} - {booking.endTime} ({booking.durationMin}min)</span>
                </div>
                {booking.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>
                      {booking.location.name}
                      {booking.location.addressLine1 && ` - ${booking.location.addressLine1}`}
                      {booking.location.city && `, ${booking.location.city}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Join Call button for confirmed video sessions (hide if session ended) */}
              {booking.status === 'CONFIRMED' && booking.sessionType === 'VIDEO_CALL' && booking.dailyRoomUrl && !isSessionExpired && (
                <Button
                  className="w-full"
                  onClick={() => navigate(routes.dashboardBookingCall(booking.id))}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Join Video Call
                </Button>
              )}

              {booking.notes && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{booking.notes}</p>
                </div>
              )}

              {booking.cancellationReason && (
                <p className="text-sm text-destructive">Cancellation reason: {booking.cancellationReason}</p>
              )}
              {booking.declineReason && (
                <p className="text-sm text-destructive">Decline reason: {booking.declineReason}</p>
              )}
            </CardContent>
          </Card>

          {/* Confirm/Decline actions for confirming party */}
          {isConfirmingParty && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm mb-3">
                  {otherPartyName} has requested this session. Would you like to confirm?
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => confirmMutation.mutate({ id: booking.id })}
                    disabled={confirmMutation.isPending}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Confirm
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDecline(true)}
                    disabled={declineMutation.isPending}
                  >
                    Decline
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowSuggest(true)}
                  >
                    <CalendarClock className="h-4 w-4 mr-1" />
                    Suggest Alternative
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reschedule chain */}
          {(booking.rescheduledFrom || booking.rescheduledTo) && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <h4 className="text-sm font-medium">Reschedule History</h4>
                {booking.rescheduledFrom && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ArrowRight className="h-4 w-4" />
                    <span>
                      Rescheduled from{' '}
                      {new Date(booking.rescheduledFrom.date).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short',
                      })}{' '}
                      at {booking.rescheduledFrom.startTime}
                    </span>
                  </div>
                )}
                {booking.rescheduledTo && (
                  <p className="text-sm text-muted-foreground">
                    This booking has been rescheduled to a new time.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Suggestions */}
          {booking.status === 'PENDING' && (
            <SuggestionsList
              bookingId={booking.id}
              canRespond={isInitiator}
            />
          )}
        </div>

        {/* Dialogs */}
        <ConfirmDialog
          open={showCancel}
          onOpenChange={setShowCancel}
          title="Cancel Booking"
          description={`Are you sure you want to cancel this booking with ${otherPartyName}?`}
          onConfirm={() => {
            cancelMutation.mutate(
              { id: booking.id },
              { onSuccess: () => setShowCancel(false) }
            );
          }}
          confirmLabel="Cancel Booking"
          variant="destructive"
        />

        <ConfirmDialog
          open={showDecline}
          onOpenChange={setShowDecline}
          title="Decline Booking"
          description={`Are you sure you want to decline this session request from ${otherPartyName}?`}
          onConfirm={() => {
            declineMutation.mutate(
              { id: booking.id },
              { onSuccess: () => setShowDecline(false) }
            );
          }}
          confirmLabel="Decline"
          variant="destructive"
        />

        {showSuggest && trainerId && (
          <SuggestAlternativeDialog
            open={showSuggest}
            onOpenChange={setShowSuggest}
            bookingId={booking.id}
            trainerId={trainerId}
            durationMin={booking.durationMin}
          />
        )}
      </PageLayout.Content>
    </PageLayout>
  );
};

export default BookingDetailPage;
