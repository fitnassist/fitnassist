import { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Text, Button, Input, Card, CardContent, Skeleton } from '@/components/ui';
import { useTrainerByHandle } from '@/api/trainer';
import { useAvailableSlots, useAvailableDates } from '@/api/availability';
import { trpc } from '@/lib/trpc';
import { colors } from '@/constants/theme';

type Step = 'date' | 'time' | 'details' | 'confirm';

const today = new Date().toISOString().split('T')[0]!;
const thirtyDaysOut = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]!;

const BookSessionScreen = () => {
  const { trainerId } = useLocalSearchParams<{ trainerId: string }>();
  const router = useRouter();

  const [step, setStep] = useState<Step>('date');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<{ startTime: string; endTime: string; durationMin: number } | null>(null);
  const [sessionType, setSessionType] = useState<'IN_PERSON' | 'VIDEO_CALL'>('IN_PERSON');
  const [notes, setNotes] = useState('');

  const { data: availableDates } = useAvailableDates(trainerId ?? '', today, thirtyDaysOut);
  const { data: slots, isLoading: slotsLoading } = useAvailableSlots(trainerId ?? '', selectedDate);
  const createBooking = trpc.booking.create.useMutation();
  const utils = trpc.useUtils();

  const markedDates: Record<string, any> = {};
  for (const d of availableDates ?? []) {
    markedDates[d] = { marked: true, dotColor: colors.teal };
  }
  if (selectedDate) {
    markedDates[selectedDate] = { ...(markedDates[selectedDate] ?? {}), selected: true, selectedColor: colors.primary };
  }

  const handleSubmit = async () => {
    if (!trainerId || !selectedDate || !selectedSlot) return;
    try {
      await createBooking.mutateAsync({
        trainerId,
        date: new Date(selectedDate + 'T00:00:00').toISOString(),
        startTime: selectedSlot.startTime,
        durationMin: selectedSlot.durationMin,
        sessionType,
        notes: notes || undefined,
      } as any);
      utils.booking.upcoming.invalidate();
      Alert.alert('Booking Requested', 'Your booking request has been sent to the trainer.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to create booking');
    }
  };

  const goNext = () => {
    const steps: Step[] = ['date', 'time', 'details', 'confirm'];
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]!);
  };

  const goBack = () => {
    const steps: Step[] = ['date', 'time', 'details', 'confirm'];
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
        <Text className="text-base font-semibold text-foreground">Book Session</Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-4 pb-8">
        {step === 'date' && (
          <>
            <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Select Date</Text>
            <Calendar
              minDate={today}
              maxDate={thirtyDaysOut}
              onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
              markedDates={markedDates}
              theme={{
                calendarBackground: 'transparent',
                todayTextColor: colors.teal,
                dayTextColor: colors.foreground,
                textDisabledColor: colors.muted,
                arrowColor: colors.teal,
                monthTextColor: colors.foreground,
                textMonthFontWeight: '300',
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: '#fff',
              }}
            />
            <Button onPress={goNext} disabled={!selectedDate}>Continue</Button>
          </>
        )}

        {step === 'time' && (
          <>
            <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Select Time</Text>
            {slotsLoading ? (
              <View className="gap-2">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
              </View>
            ) : !slots || slots.length === 0 ? (
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

        {step === 'details' && (
          <>
            <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Session Details</Text>
            <Text className="text-sm font-medium text-foreground">Session Type</Text>
            <View className="flex-row gap-2">
              {(['IN_PERSON', 'VIDEO_CALL'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  className={`flex-1 items-center py-3 rounded-lg border-2 ${sessionType === type ? 'border-teal bg-teal/10' : 'border-border'}`}
                  onPress={() => setSessionType(type)}
                >
                  <Text className={`text-sm font-medium ${sessionType === type ? 'text-teal' : 'text-muted-foreground'}`}>
                    {type === 'VIDEO_CALL' ? 'Video Call' : 'In Person'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input label="Notes (optional)" value={notes} onChangeText={setNotes} multiline placeholder="Any notes for the trainer..." />
            <Button onPress={goNext}>Review Booking</Button>
          </>
        )}

        {step === 'confirm' && (
          <>
            <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Confirm Booking</Text>
            <Card>
              <CardContent className="py-4 px-4 gap-2">
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted-foreground">Date</Text>
                  <Text className="text-sm font-medium text-foreground">
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <View className="border-b border-border" />
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted-foreground">Time</Text>
                  <Text className="text-sm font-medium text-foreground">{selectedSlot?.startTime} - {selectedSlot?.endTime}</Text>
                </View>
                <View className="border-b border-border" />
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted-foreground">Type</Text>
                  <Text className="text-sm font-medium text-foreground">{sessionType === 'VIDEO_CALL' ? 'Video Call' : 'In Person'}</Text>
                </View>
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
            <Button onPress={handleSubmit} loading={createBooking.isPending}>Request Booking</Button>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default BookSessionScreen;
