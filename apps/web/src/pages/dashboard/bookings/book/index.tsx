import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Video, MapPin } from 'lucide-react';
import type { AddressDetails } from '@/components/ui';
import { Skeleton, Card, CardContent } from '@/components/ui';
import { PageLayout } from '@/components/layouts';
import { useAvailableDates, useAvailableSlots } from '@/api/availability';
import { useCreateBooking } from '@/api/booking';
import { trpc } from '@/lib/trpc';
import { routes } from '@/config/routes';
import type { SessionType } from '@fitnassist/schemas';
import { DatePicker } from './components/DatePicker';
import { SlotPicker } from './components/SlotPicker';
import { LocationPicker } from './components/LocationPicker';
import { BookingConfirmation } from './components/BookingConfirmation';

type Step = 'date' | 'time' | 'session-type' | 'location' | 'confirm';

export const BookSessionPage = () => {
  const { trainerId } = useParams<{ trainerId: string }>();
  const navigate = useNavigate();
  const createBooking = useCreateBooking();

  // Get trainer info
  const { data: trainer, isLoading: trainerLoading } = trpc.trainer.getById.useQuery(
    { id: trainerId! },
    { enabled: !!trainerId }
  );

  const [step, setStep] = useState<Step>('date');
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [clientAddressDetails, setClientAddressDetails] = useState<AddressDetails | null>(null);
  const [sessionType, setSessionType] = useState<SessionType>('IN_PERSON');
  const [notes, setNotes] = useState('');

  // Get trainee profile for "Use my address" feature
  const { data: traineeProfile } = trpc.trainee.getMyProfile.useQuery();

  // Date range for available dates (current month view)
  const startDate = useMemo(() => {
    const d = new Date(month.getFullYear(), month.getMonth(), 1);
    return d.toISOString().split('T')[0]!;
  }, [month]);
  const endDate = useMemo(() => {
    const d = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    return d.toISOString().split('T')[0]!;
  }, [month]);

  const { data: availableDates } = useAvailableDates(trainerId ?? '', startDate, endDate);
  const { data: slots, isLoading: slotsLoading } = useAvailableSlots(
    trainerId ?? '',
    selectedDate ?? '',
    undefined
  );

  // Get trainer's session locations (for the location step)
  const { data: trainerLocations } = trpc.sessionLocation.listByTrainer.useQuery(
    { trainerId: trainerId! },
    { enabled: !!trainerId && step === 'location' }
  );

  const selectedSlotObj = slots?.find((s) => s.startTime === selectedSlot);

  // We need clientRosterId to create booking. Get it via the client-roster.
  // The trainee needs to have a connection with this trainer.
  const { data: clientRoster } = trpc.clientRoster.myTrainers.useQuery(undefined, {
    enabled: !!trainerId,
  });

  const myRoster = clientRoster?.find((r: { trainer?: { id: string } }) => r.trainer?.id === trainerId);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setStep('time');
  };

  const handleSlotSelect = (startTime: string) => {
    setSelectedSlot(startTime);
    // Show session type picker if trainer offers video, otherwise skip to location
    if (trainer?.offersVideoSessions) {
      setStep('session-type');
    } else {
      setStep('location');
    }
  };

  const handleSessionTypeSelect = (type: SessionType) => {
    setSessionType(type);
    if (type === 'VIDEO_CALL') {
      // Skip location step for video calls
      setStep('confirm');
    } else {
      setStep('location');
    }
  };

  const handleConfirm = () => {
    if (!trainerId || !selectedDate || !selectedSlot || !selectedSlotObj || !myRoster) return;

    createBooking.mutate(
      {
        trainerId,
        clientRosterId: myRoster.id,
        date: selectedDate,
        startTime: selectedSlot,
        durationMin: selectedSlotObj.durationMin,
        sessionType,
        locationId: sessionType === 'VIDEO_CALL' ? undefined : (selectedLocationId ?? undefined),
        clientAddress: sessionType === 'VIDEO_CALL' ? undefined : (clientAddressDetails?.addressLine1 || undefined),
        clientPostcode: sessionType === 'VIDEO_CALL' ? undefined : (clientAddressDetails?.postcode || undefined),
        clientLatitude: sessionType === 'VIDEO_CALL' ? undefined : (clientAddressDetails?.latitude || undefined),
        clientLongitude: sessionType === 'VIDEO_CALL' ? undefined : (clientAddressDetails?.longitude || undefined),
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          navigate(routes.dashboardBookings);
        },
      }
    );
  };

  const trainerName = trainer?.displayName ?? 'Trainer';

  // Build step list — include session-type only if trainer offers video
  const steps: Step[] = trainer?.offersVideoSessions
    ? (sessionType === 'VIDEO_CALL'
      ? ['date', 'time', 'session-type', 'confirm']
      : ['date', 'time', 'session-type', 'location', 'confirm'])
    : ['date', 'time', 'location', 'confirm'];

  return (
    <PageLayout>
      <PageLayout.Header
        title={`Book with ${trainerName}`}
        description="Select a date and time for your session"
        icon={<Calendar className="h-6 w-6 sm:h-8 sm:w-8" />}
        backLink={{ label: 'Back to bookings', to: routes.dashboardBookings }}
      />
      <PageLayout.Content>
        {trainerLoading ? (
          <div className="space-y-6">
            {/* Step indicator skeleton */}
            <div className="flex items-center gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  {i < 3 && <Skeleton className="w-8 h-px" />}
                </div>
              ))}
            </div>
            {/* Calendar skeleton */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={`h-${i}`} className="h-4 w-full mx-auto" />
                ))}
                {Array.from({ length: 35 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-9 rounded-full mx-auto" />
                ))}
              </div>
            </div>
          </div>
        ) : (
        <>
        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-6">
          {(steps).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s === step
                    ? 'bg-primary text-primary-foreground'
                    : i < steps.indexOf(step)
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {i + 1}
              </div>
              {i < steps.length - 1 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        {step === 'date' && (
          <DatePicker
            availableDates={availableDates ?? []}
            selectedDate={selectedDate}
            onSelect={handleDateSelect}
            month={month}
            onMonthChange={setMonth}
          />
        )}

        {step === 'time' && (
          <div>
            <h3 className="font-medium mb-3">
              Available times for{' '}
              {selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </h3>
            <SlotPicker
              slots={slots ?? []}
              selectedSlot={selectedSlot}
              onSelect={handleSlotSelect}
              isLoading={slotsLoading}
            />
            <button
              className="text-sm text-muted-foreground mt-4 hover:underline"
              onClick={() => setStep('date')}
            >
              Change date
            </button>
          </div>
        )}

        {step === 'session-type' && (
          <div>
            <h3 className="font-medium mb-3">How would you like to train?</h3>
            <div className="grid grid-cols-2 gap-3">
              <Card
                className={`cursor-pointer transition-colors hover:bg-accent/50 ${sessionType === 'IN_PERSON' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => handleSessionTypeSelect('IN_PERSON')}
              >
                <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                  <MapPin className="h-8 w-8 text-primary" />
                  <span className="font-medium text-sm">In Person</span>
                  <span className="text-xs text-muted-foreground">Meet at a location</span>
                </CardContent>
              </Card>
              <Card
                className={`cursor-pointer transition-colors hover:bg-accent/50 ${sessionType === 'VIDEO_CALL' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => handleSessionTypeSelect('VIDEO_CALL')}
              >
                <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                  <Video className="h-8 w-8 text-primary" />
                  <span className="font-medium text-sm">Video Call</span>
                  <span className="text-xs text-muted-foreground">Train from anywhere</span>
                </CardContent>
              </Card>
            </div>
            <button
              className="text-sm text-muted-foreground mt-4 hover:underline"
              onClick={() => setStep('time')}
            >
              Change time
            </button>
          </div>
        )}

        {step === 'location' && (
          <div>
            <h3 className="font-medium mb-3">Choose a location</h3>
            <LocationPicker
              locations={trainerLocations ?? []}
              selectedLocationId={selectedLocationId}
              onSelectLocation={(id) => {
                setSelectedLocationId(id);
                setStep('confirm');
              }}
              onClientAddressChange={(address) => {
                setClientAddressDetails(address);
              }}
              traineeAddress={traineeProfile}
              showClientAddress
            />
            {(clientAddressDetails || !trainerLocations?.length) && (
              <button
                className="text-sm text-primary mt-3 hover:underline"
                onClick={() => setStep('confirm')}
              >
                Continue with this address
              </button>
            )}
            <button
              className="text-sm text-muted-foreground mt-2 block hover:underline"
              onClick={() => setStep('time')}
            >
              Change time
            </button>
          </div>
        )}

        {step === 'confirm' && selectedDate && selectedSlot && selectedSlotObj && (
          <BookingConfirmation
            date={selectedDate}
            startTime={selectedSlot}
            durationMin={selectedSlotObj.durationMin}
            sessionType={sessionType}
            locationName={sessionType === 'VIDEO_CALL' ? undefined : trainerLocations?.find((l) => l.id === selectedLocationId)?.name}
            clientAddress={sessionType === 'VIDEO_CALL' ? '' : (clientAddressDetails ? [clientAddressDetails.addressLine1, clientAddressDetails.city, clientAddressDetails.postcode].filter(Boolean).join(', ') : '')}
            notes={notes}
            onNotesChange={setNotes}
            onConfirm={handleConfirm}
            onBack={() => setStep(sessionType === 'VIDEO_CALL' ? 'session-type' : 'location')}
            isSubmitting={createBooking.isPending}
          />
        )}
        </>
        )}
      </PageLayout.Content>
    </PageLayout>
  );
};

export default BookSessionPage;
