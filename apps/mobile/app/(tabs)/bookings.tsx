import { useState, useMemo } from 'react';
import { View, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar as CalendarIcon, List, Plus } from 'lucide-react-native';
import { Text, Skeleton } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useUpcomingBookings, useTrainerBookings } from '@/api/booking';
import { BookingCard } from '@/components/bookings';
import { BookingCalendar } from '@/components/bookings/BookingCalendar';
import { colors } from '@/constants/theme';

const getMonthRange = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    startDate: start.toISOString().split('T')[0]!,
    endDate: end.toISOString().split('T')[0]!,
  };
};

const today = new Date().toISOString().split('T')[0]!;

const BookingsScreen = () => {
  const router = useRouter();
  const { role } = useAuth();
  const isTrainer = role === 'TRAINER';
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>(isTrainer ? 'calendar' : 'list');
  const [selectedDate, setSelectedDate] = useState(today);
  const [range] = useState(() => getMonthRange(new Date()));

  const {
    data: upcomingBookings,
    isLoading: upcomingLoading,
    refetch: refetchUpcoming,
  } = useUpcomingBookings();

  const {
    data: trainerBookings,
    isLoading: trainerLoading,
    refetch: refetchTrainer,
  } = useTrainerBookings(range.startDate, range.endDate);

  const isLoading = isTrainer ? trainerLoading : upcomingLoading;
  const allBookings: any[] = isTrainer ? (trainerBookings ?? []) : (upcomingBookings ?? []);

  const onRefresh = async () => {
    if (isTrainer) await refetchTrainer();
    else await refetchUpcoming();
  };

  // Filter bookings for selected date (calendar view)
  const selectedDayBookings = useMemo(() => {
    if (!selectedDate) return allBookings;
    return allBookings.filter((b: any) => {
      const bDate = typeof b.date === 'string'
        ? b.date.split('T')[0]
        : new Date(b.date).toISOString().split('T')[0];
      return bDate === selectedDate;
    });
  }, [allBookings, selectedDate]);

  const displayBookings = viewMode === 'calendar' ? selectedDayBookings : allBookings;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="px-4 py-4">
          <Text className="text-2xl font-extralight text-foreground uppercase" style={{ letterSpacing: 2 }}>
            Bookings
          </Text>
        </View>
        <View className="px-4 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header with view toggle */}
      <View className="flex-row items-center justify-between px-4 py-4">
        <Text className="text-2xl font-extralight text-foreground uppercase" style={{ letterSpacing: 2 }}>
          Bookings
        </Text>
        {isTrainer && (
          <View className="flex-row gap-1 bg-card border border-border rounded-lg p-1">
            <TouchableOpacity
              className={`px-3 py-1.5 rounded-md ${viewMode === 'calendar' ? 'bg-primary' : ''}`}
              onPress={() => setViewMode('calendar')}
            >
              <CalendarIcon size={16} color={viewMode === 'calendar' ? '#fff' : colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity
              className={`px-3 py-1.5 rounded-md ${viewMode === 'list' ? 'bg-primary' : ''}`}
              onPress={() => setViewMode('list')}
            >
              <List size={16} color={viewMode === 'list' ? '#fff' : colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Calendar (trainer only, calendar mode) */}
      {viewMode === 'calendar' && isTrainer && (
        <BookingCalendar
          bookings={allBookings}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      )}

      {/* Date label when in calendar mode */}
      {viewMode === 'calendar' && selectedDate && (
        <View className="px-4 pt-3 pb-1">
          <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
      )}

      {/* Bookings list */}
      {displayBookings.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6 gap-2">
          <Text className="text-sm text-muted-foreground">
            {viewMode === 'calendar' ? 'No bookings on this day' : 'No upcoming bookings'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayBookings}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }) => (
            <View className="px-4 mb-2">
              <BookingCard
                booking={item}
                isTrainer={isTrainer}
                onPress={() => router.push(`/bookings/${item.id}`)}
              />
            </View>
          )}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.teal} />
          }
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
        />
      )}

      {/* FAB - Create booking (trainer) */}
      {isTrainer && (
        <TouchableOpacity
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center"
          style={{ elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 }}
          onPress={() => router.push('/bookings/create')}
          activeOpacity={0.8}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

export default BookingsScreen;
