import { useMemo } from 'react';
import { View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { colors } from '@/constants/theme';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  CONFIRMED: colors.teal,
  COMPLETED: colors.mutedForeground,
  DECLINED: colors.destructive,
  CANCELLED_BY_TRAINER: colors.destructive,
  CANCELLED_BY_CLIENT: colors.destructive,
  NO_SHOW: '#f97316',
  RESCHEDULED: colors.mutedForeground,
};

interface BookingCalendarProps {
  bookings: {
    id: string;
    date: string | Date;
    status: string;
  }[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export const BookingCalendar = ({ bookings, selectedDate, onSelectDate }: BookingCalendarProps) => {
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    for (const booking of bookings) {
      const dateStr = typeof booking.date === 'string'
        ? booking.date.split('T')[0]
        : booking.date.toISOString().split('T')[0];

      if (!dateStr) continue;

      if (!marks[dateStr]) {
        marks[dateStr] = { dots: [], marked: true };
      }

      const color = STATUS_COLORS[booking.status] ?? colors.mutedForeground;
      // Avoid duplicate dot colors for same date
      if (!marks[dateStr].dots.some((d: any) => d.color === color)) {
        marks[dateStr].dots.push({ key: booking.id, color });
      }
    }

    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] ?? {}),
        selected: true,
        selectedColor: colors.primary,
      };
    }

    return marks;
  }, [bookings, selectedDate]);

  return (
    <View>
      <Calendar
        markingType="multi-dot"
        markedDates={markedDates}
        onDayPress={(day: { dateString: string }) => onSelectDate(day.dateString)}
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
    </View>
  );
};
