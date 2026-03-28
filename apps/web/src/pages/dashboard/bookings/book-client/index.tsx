import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Video, MapPin } from 'lucide-react';
import type { AddressDetails } from '@/components/ui';
import { Skeleton, Card, CardContent, Avatar, AvatarFallback, AvatarImage } from '@/components/ui';
import { PageLayout } from '@/components/layouts';
import { useAvailableDates, useAvailableSlots } from '@/api/availability';
import { useCreateBookingForClient } from '@/api/booking';
import { usePaymentRequirement } from '@/api/payment';
import { useClients } from '@/api/client-roster';
import { trpc } from '@/lib/trpc';
import { routes } from '@/config/routes';
import type { SessionType } from '@fitnassist/schemas';
import { DatePicker } from '../book/components/DatePicker';
import { SlotPicker } from '../book/components/SlotPicker';
import { LocationPicker } from '../book/components/LocationPicker';
import { BookingConfirmation } from '../book/components/BookingConfirmation';

type Step = 'client' | 'date' | 'time' | 'session-type' | 'location' | 'confirm';

export const TrainerBookSessionPage = () => {
  const { clientRosterId: preselectedClientId } = useParams<{ clientRosterId: string }>();
  const navigate = useNavigate();
  const createBooking = useCreateBookingForClient();

  // Fetch active clients for the picker
  const { data: clientsData, isLoading: clientsLoading } = useClients({
    status: 'ACTIVE',
    limit: 100,
  });
  const clients = clientsData?.clients ?? [];

  const [step, setStep] = useState<Step>(preselectedClientId ? 'date' : 'client');
  const [selectedClientRosterId, setSelectedClientRosterId] = useState<string | null>(preselectedClientId ?? null);
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [clientAddressDetails, setClientAddressDetails] = useState<AddressDetails | null>(null);
  const [sessionType, setSessionType] = useState<SessionType>('IN_PERSON');
  const [notes, setNotes] = useState('');
  const [isFreeSession, setIsFreeSession] = useState(false);

  // Get own trainer profile for trainerId and video settings
  const { data: trainerProfile, isLoading: trainerLoading } = trpc.trainer.getMyProfile.useQuery();
  const trainerId = trainerProfile?.id ?? '';
  const offersVideo = trainerProfile?.offersVideoSessions ?? false;

  // Date range for available dates
  const startDate = useMemo(() => {
    const d = new Date(month.getFullYear(), month.getMonth(), 1);
    return d.toISOString().split('T')[0]!;
  }, [month]);
  const endDate = useMemo(() => {
    const d = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    return d.toISOString().split('T')[0]!;
  }, [month]);

  const { data: availableDates } = useAvailableDates(trainerId, startDate, endDate);
  const { data: slots, isLoading: slotsLoading } = useAvailableSlots(
    trainerId,
    selectedDate ?? '',
    undefined
  );

  // Get own session locations
  const { data: trainerLocations } = trpc.sessionLocation.listByTrainer.useQuery(
    { trainerId },
    { enabled: !!trainerId && step === 'location' }
  );

  // Check if trainer has payments enabled (to show free session toggle)
  const { data: paymentReq } = usePaymentRequirement(
    trainerId,
    selectedClientRosterId ?? ''
  );
  const trainerHasPayments = paymentReq?.paymentRequired === true;

  const selectedSlotObj = slots?.find((s) => s.startTime === selectedSlot);
  const selectedClient = clients.find((c) => c.id === selectedClientRosterId);
  const clientName = selectedClient?.connection?.sender?.name ?? selectedClient?.connection?.name ?? 'Client';

  const handleClientSelect = (clientId: string) => {
    setSelectedClientRosterId(clientId);
    setStep('date');
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setStep('time');
  };

  const handleSlotSelect = (startTime: string) => {
    setSelectedSlot(startTime);
    if (offersVideo) {
      setStep('session-type');
    } else {
      setStep('location');
    }
  };

  const handleSessionTypeSelect = (type: SessionType) => {
    setSessionType(type);
    if (type === 'VIDEO_CALL') {
      setStep('confirm');
    } else {
      setStep('location');
    }
  };

  const handleConfirm = () => {
    if (!selectedClientRosterId || !selectedDate || !selectedSlot || !selectedSlotObj) return;

    createBooking.mutate(
      {
        clientRosterId: selectedClientRosterId,
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
        isFreeSession: trainerHasPayments ? isFreeSession : undefined,
      },
      {
        onSuccess: () => {
          navigate(routes.dashboardBookings);
        },
      }
    );
  };

  // Build step list
  const baseSteps: Step[] = preselectedClientId
    ? ['date', 'time']
    : ['client', 'date', 'time'];

  const steps: Step[] = offersVideo
    ? (sessionType === 'VIDEO_CALL'
      ? [...baseSteps, 'session-type', 'confirm']
      : [...baseSteps, 'session-type', 'location', 'confirm'])
    : [...baseSteps, 'location', 'confirm'];

  const isLoading = trainerLoading || clientsLoading;

  const title = selectedClient
    ? `Book with ${clientName}`
    : 'Book a Session';

  return (
    <PageLayout>
      <PageLayout.Header
        title={title}
        description="Schedule a session with your client"
        icon={<Calendar className="h-6 w-6 sm:h-8 sm:w-8" />}
        backLink={{ label: 'Back to bookings', to: routes.dashboardBookings }}
      />
      <PageLayout.Content>
        {isLoading ? (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  {i < 3 && <Skeleton className="w-8 h-px" />}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ) : (
        <>
        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-6">
          {steps.map((s, i) => (
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

        {step === 'client' && (
          <div>
            <h3 className="font-medium mb-3">Select a client</h3>
            {clients.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active clients found.</p>
            ) : (
              <div className="space-y-2">
                {clients.map((client) => {
                  const sender = client.connection?.sender;
                  const name = sender?.name ?? client.connection?.name ?? 'Client';
                  const avatarUrl = sender?.traineeProfile?.avatarUrl ?? sender?.image;
                  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

                  return (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => handleClientSelect(client.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-accent/50 ${
                        selectedClientRosterId === client.id ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-medium text-sm">{name}</span>
                          {client.connection?.email && (
                            <p className="text-xs text-muted-foreground">{client.connection.email}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

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
            <h3 className="font-medium mb-3">Session type</h3>
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
              showClientAddress={false}
            />
            {(clientAddressDetails || !trainerLocations?.length) && (
              <button
                className="text-sm text-primary mt-3 hover:underline"
                onClick={() => setStep('confirm')}
              >
                Continue
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
            paymentInfo={trainerHasPayments ? { amount: paymentReq!.amount, currency: paymentReq!.currency } : null}
            isFreeSession={isFreeSession}
            onFreeSessionChange={trainerHasPayments ? setIsFreeSession : undefined}
          />
        )}
        </>
        )}
      </PageLayout.Content>
    </PageLayout>
  );
};

export default TrainerBookSessionPage;
