import { useState, useMemo } from 'react';
import { View, SectionList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar as CalendarIcon } from 'lucide-react-native';
import { Text, Skeleton } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useUpcomingBookings, useTrainerBookings } from '@/api/booking';
import { BookingCard } from '@/components/bookings';
import { colors } from '@/constants/theme';

const getDateRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 30);
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
};

const BookingsScreen = () => {
  const router = useRouter();
  const { role } = useAuth();
  const isTrainer = role === 'TRAINER';
  const [range] = useState(getDateRange);

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
  const bookings = isTrainer ? (trainerBookings ?? []) : (upcomingBookings ?? []);

  const onRefresh = async () => {
    if (isTrainer) await refetchTrainer();
    else await refetchUpcoming();
  };

  // Group bookings by date
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sections = useMemo(() => {
    const grouped = new Map<string, any[]>();
    for (const booking of bookings) {
      const dateKey = new Date(booking.date).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      if (!grouped.has(dateKey)) grouped.set(dateKey, []);
      grouped.get(dateKey)!.push(booking);
    }
    return Array.from(grouped.entries()).map(([title, data]) => ({ title, data }));
  }, [bookings]);

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
      <View className="px-4 py-4">
        <Text className="text-2xl font-extralight text-foreground uppercase" style={{ letterSpacing: 2 }}>
          Bookings
        </Text>
      </View>

      {sections.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6 gap-3">
          <CalendarIcon size={48} color={colors.mutedForeground} />
          <Text className="text-base text-muted-foreground text-center">
            No upcoming bookings
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item: any) => item.id}
          renderSectionHeader={({ section }) => (
            <View className="px-4 pt-4 pb-2">
              <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>
                {section.title}
              </Text>
            </View>
          )}
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
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
};

export default BookingsScreen;
