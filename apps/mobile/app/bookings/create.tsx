import { useState } from 'react';
import { View, ScrollView, Alert, TouchableOpacity as RNTouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown, Check } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Text, Button, Input, Card, CardContent, Skeleton } from '@/components/ui';
import { useClients } from '@/api/client';
import { useAvailableSlots } from '@/api/availability';
import { useMyTrainerProfile } from '@/api/trainer';
import { trpc } from '@/lib/trpc';
import { colors } from '@/constants/theme';

type Step = 'client' | 'date' | 'time' | 'details' | 'confirm';

const today = new Date().toISOString().split('T')[0]!;

const CreateBookingScreen = () => {
  const router = useRouter();
  const { data: profile } = useMyTrainerProfile();
  const { data: clients, isLoading: clientsLoading } = useClients();
  const createBooking = trpc.booking.createForClient.useMutation();
  const utils = trpc.useUtils();

  const [step, setStep] = useState<Step>('client');
  const [clientRosterId, setClientRosterId] = useState('');
  const [clientName, setClientName] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<{ startTime: string; endTime: string; durationMin: number } | null>(null);
  const [sessionType, setSessionType] = useState<'IN_PERSON' | 'VIDEO_CALL'>('IN_PERSON');
  const [notes, setNotes] = useState('');
  const [isFree, setIsFree] = useState(false);

  const { data: slots, isLoading: slotsLoading } = useAvailableSlots(
    profile?.id ?? '',
    selectedDate,
    60,
  );

  const handleSubmit = async () => {
    if (!clientRosterId || !selectedDate || !selectedSlot || !profile) return;

    try {
      await createBooking.mutateAsync({
        clientRosterId,
        date: new Date(selectedDate + 'T00:00:00').toISOString(),
        startTime: selectedSlot.startTime,
        durationMin: selectedSlot.durationMin,
        sessionType,
        notes: notes || undefined,
        isFreeSession: isFree,
      });
      utils.booking.upcoming.invalidate();
      utils.booking.listByDateRange.invalidate();
      Alert.alert('Success', 'Booking created', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to create booking');
    }
  };

  const goNext = () => {
    const steps: Step[] = ['client', 'date', 'time', 'details', 'confirm'];
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]!);
  };

  const goBack = () => {
    const steps: Step[] = ['client', 'date', 'time', 'details', 'confirm'];
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]!);
    else router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={goBack}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">Book for Client</Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-4 pb-8">

        {/* Step 1: Select Client */}
        {step === 'client' && (
          <>
            <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>
              Select Client
            </Text>
            {clientsLoading ? (
              <View className="gap-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
              </View>
            ) : (
              <View className="gap-2">
                {((clients as any)?.clients ?? []).map((client: any) => {
                  const name = client.client?.user?.name ?? client.clientName ?? 'Unknown';
                  const selected = client.id === clientRosterId;
                  return (
                    <RNTouchableOpacity
                      key={client.id}
                      className={`flex-row items-center justify-between p-4 rounded-lg border ${
                        selected ? 'border-primary bg-primary/10' : 'border-border bg-card'
                      }`}
                      onPress={() => {
                        setClientRosterId(client.id);
                        setClientName(name);
                      }}
                    >
                      <Text className={`text-base ${selected ? 'text-primary font-semibold' : 'text-foreground'}`}>
                        {name}
                      </Text>
                      {selected && <Check size={18} color={colors.primary} />}
                    </RNTouchableOpacity>
                  );
                })}
              </View>
            )}
            <Button onPress={goNext} disabled={!clientRosterId}>
              Continue
            </Button>
          </>
        )}

        {/* Step 2: Select Date */}
        {step === 'date' && (
          <>
            <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>
              Select Date
            </Text>
            <Calendar
              minDate={today}
              onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
              markedDates={selectedDate ? {
                [selectedDate]: { selected: true, selectedColor: colors.primary },
              } : {}}
              theme={{
                calendarBackground: 'transparent',
                textSectionTitleColor: colors.mutedForeground,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: '#fff',
                todayTextColor: colors.teal,
                dayTextColor: colors.foreground,
                textDisabledColor: colors.muted,
                arrowColor: colors.teal,
                monthTextColor: colors.foreground,
                textMonthFontWeight: '300',
                textDayFontSize: 14,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 12,
              }}
            />
            <Button onPress={goNext} disabled={!selectedDate}>
              Continue
            </Button>
          </>
        )}

        {/* Step 3: Select Time */}
        {step === 'time' && (
          <>
            <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>
              Select Time
            </Text>
            <Text className="text-sm text-muted-foreground">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString(undefined, {
                weekday: 'long', month: 'long', day: 'numeric',
              })}
            </Text>
            {slotsLoading ? (
              <View className="gap-2">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
              </View>
            ) : !slots || slots.length === 0 ? (
              <Text className="text-sm text-muted-foreground text-center py-6">
                No available slots on this date
              </Text>
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {slots.map((slot: any) => {
                  const selected = selectedSlot?.startTime === slot.startTime;
                  return (
                    <RNTouchableOpacity
                      key={slot.startTime}
                      className={`px-4 py-3 rounded-lg border ${
                        selected ? 'border-primary bg-primary/10' : 'border-border bg-card'
                      }`}
                      onPress={() => setSelectedSlot(slot)}
                    >
                      <Text className={`text-sm ${selected ? 'text-primary font-semibold' : 'text-foreground'}`}>
                        {slot.startTime} - {slot.endTime}
                      </Text>
                    </RNTouchableOpacity>
                  );
                })}
              </View>
            )}
            <Button onPress={goNext} disabled={!selectedSlot}>
              Continue
            </Button>
          </>
        )}

        {/* Step 4: Session Details */}
        {step === 'details' && (
          <>
            <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>
              Session Details
            </Text>

            <Text className="text-sm font-medium text-foreground">Session Type</Text>
            <View className="flex-row gap-2">
              <RNTouchableOpacity
                className={`flex-1 items-center py-3 rounded-lg border-2 ${
                  sessionType === 'IN_PERSON' ? 'border-primary bg-primary/10' : 'border-border'
                }`}
                onPress={() => setSessionType('IN_PERSON')}
              >
                <Text className={`text-sm font-medium ${sessionType === 'IN_PERSON' ? 'text-primary' : 'text-muted-foreground'}`}>
                  In Person
                </Text>
              </RNTouchableOpacity>
              <RNTouchableOpacity
                className={`flex-1 items-center py-3 rounded-lg border-2 ${
                  sessionType === 'VIDEO_CALL' ? 'border-primary bg-primary/10' : 'border-border'
                }`}
                onPress={() => setSessionType('VIDEO_CALL')}
              >
                <Text className={`text-sm font-medium ${sessionType === 'VIDEO_CALL' ? 'text-primary' : 'text-muted-foreground'}`}>
                  Video Call
                </Text>
              </RNTouchableOpacity>
            </View>

            <RNTouchableOpacity
              className="flex-row items-center gap-3 py-3"
              onPress={() => setIsFree(!isFree)}
            >
              <View className={`w-5 h-5 rounded border-2 items-center justify-center ${
                isFree ? 'border-primary bg-primary' : 'border-border'
              }`}>
                {isFree && <Check size={12} color="#fff" />}
              </View>
              <Text className="text-sm text-foreground">Free session (no charge)</Text>
            </RNTouchableOpacity>

            <Input
              label="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              placeholder="Any notes for the client..."
              multiline
              numberOfLines={3}
            />

            <Button onPress={goNext}>
              Review Booking
            </Button>
          </>
        )}

        {/* Step 5: Confirm */}
        {step === 'confirm' && (
          <>
            <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>
              Confirm Booking
            </Text>

            <Card>
              <CardContent className="py-4 px-4 gap-2">
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted-foreground">Client</Text>
                  <Text className="text-sm font-medium text-foreground">{clientName}</Text>
                </View>
                <View className="border-b border-border" />
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted-foreground">Date</Text>
                  <Text className="text-sm font-medium text-foreground">
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString(undefined, {
                      weekday: 'short', month: 'short', day: 'numeric',
                    })}
                  </Text>
                </View>
                <View className="border-b border-border" />
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted-foreground">Time</Text>
                  <Text className="text-sm font-medium text-foreground">
                    {selectedSlot?.startTime} - {selectedSlot?.endTime}
                  </Text>
                </View>
                <View className="border-b border-border" />
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted-foreground">Type</Text>
                  <Text className="text-sm font-medium text-foreground">
                    {sessionType === 'VIDEO_CALL' ? 'Video Call' : 'In Person'}
                  </Text>
                </View>
                {isFree && (
                  <>
                    <View className="border-b border-border" />
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-muted-foreground">Price</Text>
                      <Text className="text-sm font-medium text-teal">Free</Text>
                    </View>
                  </>
                )}
                {notes ? (
                  <>
                    <View className="border-b border-border" />
                    <View>
                      <Text className="text-sm text-muted-foreground">Notes</Text>
                      <Text className="text-sm text-foreground mt-1">{notes}</Text>
                    </View>
                  </>
                ) : null}
              </CardContent>
            </Card>

            <Button onPress={handleSubmit} loading={createBooking.isPending}>
              Create Booking
            </Button>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateBookingScreen;
