import { useState, useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Video } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Text, Button, Input, Card, CardContent, Skeleton, PillSelect, AddressInput, type AddressResult, useAlert } from '@/components/ui';
import { useAvailableSlots, useAvailableDates } from '@/api/availability';
import { trpc } from '@/lib/trpc';
import { colors } from '@/constants/theme';

type Step = 'date' | 'time' | 'session-type' | 'location' | 'confirm';

const today = new Date().toISOString().split('T')[0]!;
const thirtyDaysOut = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]!;

const BookSessionScreen = () => {
  const { showAlert } = useAlert();
  const { trainerId } = useLocalSearchParams<{ trainerId: string }>();
  const router = useRouter();

  const [step, setStep] = useState<Step>('date');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<{ startTime: string; endTime: string; durationMin: number } | null>(null);
  const [sessionType, setSessionType] = useState<'IN_PERSON' | 'VIDEO_CALL'>('IN_PERSON');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [clientAddress, setClientAddress] = useState<AddressResult | null>(null);
  const [notes, setNotes] = useState('');

  const { data: trainerInfo } = trpc.trainer.getById.useQuery({ id: trainerId! }, { enabled: !!trainerId });
  const { data: myRoster } = trpc.clientRoster.myTrainers.useQuery(undefined, { enabled: !!trainerId });
  const clientRosterId = (myRoster as any[])?.find((r: any) => r.trainer?.id === trainerId || r.trainerId === trainerId)?.id ?? '';

  const { data: availableDates } = useAvailableDates(trainerId ?? '', today, thirtyDaysOut);
  const { data: slots, isLoading: slotsLoading } = useAvailableSlots(trainerId ?? '', selectedDate);
  const { data: trainerLocations } = trpc.sessionLocation.listByTrainer.useQuery(
    { trainerId: trainerId! },
    { enabled: !!trainerId && step === 'location' },
  );

  const createBooking = trpc.booking.create.useMutation();
  const utils = trpc.useUtils();

  const markedDates: Record<string, any> = useMemo(() => {
    const marks: Record<string, any> = {};
    for (const d of availableDates ?? []) {
      marks[d] = { marked: true, dotColor: colors.teal };
    }
    if (selectedDate) {
      marks[selectedDate] = { ...(marks[selectedDate] ?? {}), selected: true, selectedColor: colors.primary };
    }
    return marks;
  }, [availableDates, selectedDate]);

  const offersVideo = !!(trainerInfo as any)?.offersVideoSessions;

  const goNext = () => {
    if (step === 'date') setStep('time');
    else if (step === 'time') setStep(offersVideo ? 'session-type' : 'location');
    else if (step === 'session-type') setStep(sessionType === 'VIDEO_CALL' ? 'confirm' : 'location');
    else if (step === 'location') setStep('confirm');
  };

  const goBack = () => {
    if (step === 'time') setStep('date');
    else if (step === 'session-type') setStep('time');
    else if (step === 'location') setStep(offersVideo ? 'session-type' : 'time');
    else if (step === 'confirm') setStep(sessionType === 'VIDEO_CALL' ? 'session-type' : 'location');
    else router.back();
  };

  const handleSubmit = async () => {
    if (!trainerId || !selectedDate || !selectedSlot || !clientRosterId) {
      showAlert({ title: 'Error', message: !clientRosterId ? 'You must be connected to this trainer to book.' : 'Missing booking details' });
      return;
    }
    try {
      await createBooking.mutateAsync({
        trainerId,
        clientRosterId,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        durationMin: selectedSlot.durationMin,
        sessionType,
        locationId: selectedLocationId ?? undefined,
        clientAddress: clientAddress?.addressLine1 ?? undefined,
        clientPostcode: clientAddress?.postcode ?? undefined,
        clientLatitude: clientAddress?.latitude ?? undefined,
        clientLongitude: clientAddress?.longitude ?? undefined,
        notes: notes || undefined,
      } as any);
      utils.booking.upcoming.invalidate();
      showAlert({
        title: 'Booking Requested',
        message: 'Your request has been sent to the trainer.',
        actions: [{ label: 'OK', onPress: () => router.back() }],
      });
    } catch (err: any) {
      showAlert({ title: 'Error', message: err.message ?? 'Failed to create booking' });
    }
  };

  const calendarTheme = {
    calendarBackground: 'transparent',
    todayTextColor: colors.teal,
    dayTextColor: colors.foreground,
    textDisabledColor: colors.muted,
    arrowColor: colors.teal,
    monthTextColor: colors.foreground,
    textMonthFontWeight: '300' as const,
    selectedDayBackgroundColor: colors.primary,
    selectedDayTextColor: '#fff',
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={goBack}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">Book Session</Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-4 pb-8">

        {/* Date */}
        {step === 'date' && (
          <>
            <Text className="text-sm font-medium text-primary uppercase" style={{ letterSpacing: 1 }}>Select Date</Text>
            <Calendar
              minDate={today}
              maxDate={thirtyDaysOut}
              onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
              markedDates={markedDates}
              theme={calendarTheme}
            />
            <Button onPress={goNext} disabled={!selectedDate}>Continue</Button>
          </>
        )}

        {/* Time */}
        {step === 'time' && (
          <>
            <Text className="text-sm font-medium text-primary uppercase" style={{ letterSpacing: 1 }}>Select Time</Text>
            <Text className="text-sm text-muted-foreground">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
            {slotsLoading ? (
              <View className="gap-2">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</View>
            ) : !slots?.length ? (
              <Text className="text-sm text-muted-foreground text-center py-6">No available slots on this date</Text>
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {slots.map((slot: any) => {
                  const selected = selectedSlot?.startTime === slot.startTime;
                  return (
                    <TouchableOpacity
                      key={slot.startTime}
                      className={`px-4 py-3 rounded-lg border ${selected ? 'border-teal bg-teal/10' : 'border-border bg-card'}`}
                      onPress={() => setSelectedSlot(slot)}
                    >
                      <Text className={`text-sm ${selected ? 'text-teal font-semibold' : 'text-foreground'}`}>
                        {slot.startTime} - {slot.endTime}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            <Button onPress={goNext} disabled={!selectedSlot}>Continue</Button>
          </>
        )}

        {/* Session Type (only if trainer offers video) */}
        {step === 'session-type' && (
          <>
            <Text className="text-sm font-medium text-primary uppercase" style={{ letterSpacing: 1 }}>How would you like to train?</Text>
            <View className="flex-row gap-3">
              {[
                { type: 'IN_PERSON' as const, label: 'In Person', icon: MapPin, desc: 'Meet at a location' },
                { type: 'VIDEO_CALL' as const, label: 'Video Call', icon: Video, desc: 'Train from anywhere' },
              ].map(({ type, label, icon: Icon, desc }) => (
                <TouchableOpacity
                  key={type}
                  className={`flex-1 rounded-lg border-2 p-4 items-center gap-2 ${sessionType === type ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
                  onPress={() => setSessionType(type)}
                >
                  <Icon size={28} color={sessionType === type ? colors.primary : colors.mutedForeground} />
                  <Text className={`text-sm font-medium ${sessionType === type ? 'text-primary' : 'text-foreground'}`}>{label}</Text>
                  <Text className="text-xs text-muted-foreground text-center">{desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button onPress={goNext}>Continue</Button>
          </>
        )}

        {/* Location */}
        {step === 'location' && (
          <>
            <Text className="text-sm font-medium text-primary uppercase" style={{ letterSpacing: 1 }}>Choose a Location</Text>
            {(trainerLocations as any[])?.length > 0 && (
              <>
                <Text className="text-xs text-muted-foreground">Trainer locations</Text>
                {(trainerLocations as any[]).map((loc: any) => (
                  <TouchableOpacity
                    key={loc.id}
                    className={`p-3 rounded-lg border ${selectedLocationId === loc.id ? 'border-teal bg-teal/10' : 'border-border bg-card'}`}
                    onPress={() => { setSelectedLocationId(loc.id); setClientAddress(null); }}
                  >
                    <Text className={`text-sm font-medium ${selectedLocationId === loc.id ? 'text-teal' : 'text-foreground'}`}>{loc.name}</Text>
                    {loc.address && <Text className="text-xs text-muted-foreground mt-0.5">{loc.address}</Text>}
                  </TouchableOpacity>
                ))}
                <Text className="text-xs text-muted-foreground">Or use your address</Text>
              </>
            )}
            {!trainerLocations?.length && (
              <Text className="text-xs text-muted-foreground">Enter your address for this session</Text>
            )}
            <AddressInput
              value={clientAddress?.addressLine1 ?? ''}
              onSelect={(addr) => { setClientAddress(addr); setSelectedLocationId(null); }}
              placeholder="Your address..."
            />
            <Button
              onPress={goNext}
              disabled={!selectedLocationId && !clientAddress}
            >
              Continue
            </Button>
          </>
        )}

        {/* Confirm */}
        {step === 'confirm' && selectedSlot && (
          <>
            <Text className="text-sm font-medium text-primary uppercase" style={{ letterSpacing: 1 }}>Confirm Booking</Text>
            <Card>
              <CardContent className="py-4 px-4 gap-3">
                {[
                  { label: 'Date', value: new Date(selectedDate + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) },
                  { label: 'Time', value: `${selectedSlot.startTime} - ${selectedSlot.endTime}` },
                  { label: 'Type', value: sessionType === 'VIDEO_CALL' ? 'Video Call' : 'In Person' },
                  ...(selectedLocationId ? [{ label: 'Location', value: (trainerLocations as any[])?.find((l: any) => l.id === selectedLocationId)?.name ?? 'Trainer location' }] : []),
                  ...(clientAddress ? [{ label: 'Address', value: [clientAddress.addressLine1, clientAddress.city, clientAddress.postcode].filter(Boolean).join(', ') }] : []),
                ].map(({ label, value }, i, arr) => (
                  <View key={label}>
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-muted-foreground">{label}</Text>
                      <Text className="text-sm font-medium text-foreground flex-1 text-right ml-4">{value}</Text>
                    </View>
                    {i < arr.length - 1 && <View className="border-b border-border mt-3" />}
                  </View>
                ))}
              </CardContent>
            </Card>
            <Input label="Notes (optional)" value={notes} onChangeText={setNotes} multiline placeholder="Any notes for the trainer..." />
            <Button onPress={handleSubmit} loading={createBooking.isPending}>Request Booking</Button>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default BookSessionScreen;
