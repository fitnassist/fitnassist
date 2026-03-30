import { View, TouchableOpacity } from 'react-native';
import { Calendar, Clock, MapPin, Video, User } from 'lucide-react-native';
import { Text, Badge } from '@/components/ui';
import { colors } from '@/constants/theme';

const STATUS_STYLES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  PENDING: { label: 'Pending', variant: 'secondary' },
  CONFIRMED: { label: 'Confirmed', variant: 'default' },
  COMPLETED: { label: 'Completed', variant: 'secondary' },
  DECLINED: { label: 'Declined', variant: 'destructive' },
  CANCELLED_BY_TRAINER: { label: 'Cancelled', variant: 'destructive' },
  CANCELLED_BY_CLIENT: { label: 'Cancelled', variant: 'destructive' },
  RESCHEDULED: { label: 'Rescheduled', variant: 'secondary' },
  NO_SHOW: { label: 'No Show', variant: 'destructive' },
};

interface BookingCardProps {
  booking: {
    id: string;
    date: string | Date;
    startTime: string;
    endTime: string;
    durationMin: number;
    status: string;
    sessionType: string;
    clientRoster?: { client?: { user?: { name: string } } };
    trainer?: { displayName?: string };
    location?: { name?: string } | null;
  };
  isTrainer: boolean;
  onPress: () => void;
}

export const BookingCard = ({ booking, isTrainer, onPress }: BookingCardProps) => {
  const status = STATUS_STYLES[booking.status] ?? { label: booking.status, variant: 'secondary' as const };
  const otherName = isTrainer
    ? booking.clientRoster?.client?.user?.name ?? 'Client'
    : booking.trainer?.displayName ?? 'Trainer';
  const date = new Date(booking.date);
  const dateStr = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const isVideo = booking.sessionType === 'VIDEO_CALL';

  return (
    <TouchableOpacity
      className="bg-card border border-border rounded-lg p-4 gap-3"
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <User size={16} color={colors.teal} />
          <Text className="text-base font-semibold text-foreground">{otherName}</Text>
        </View>
        <Badge variant={status.variant}>{status.label}</Badge>
      </View>

      <View className="gap-1.5">
        <View className="flex-row items-center gap-2">
          <Calendar size={14} color={colors.mutedForeground} />
          <Text className="text-sm text-muted-foreground">{dateStr}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Clock size={14} color={colors.mutedForeground} />
          <Text className="text-sm text-muted-foreground">
            {booking.startTime} - {booking.endTime} ({booking.durationMin}min)
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          {isVideo ? (
            <Video size={14} color={colors.teal} />
          ) : (
            <MapPin size={14} color={colors.mutedForeground} />
          )}
          <Text className="text-sm text-muted-foreground">
            {isVideo ? 'Video Call' : (booking.location?.name ?? 'In Person')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
