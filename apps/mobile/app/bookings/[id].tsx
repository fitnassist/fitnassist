import { View, ScrollView, Alert, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Video,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Button, Card, CardContent, Skeleton, Badge } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import {
  useBooking,
  useConfirmBooking,
  useDeclineBooking,
  useCancelBooking,
  useCompleteBooking,
  useNoShowBooking,
} from '@/api/booking';
import { colors } from '@/constants/theme';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  DECLINED: 'Declined',
  CANCELLED_BY_TRAINER: 'Cancelled by Trainer',
  CANCELLED_BY_CLIENT: 'Cancelled by Client',
  RESCHEDULED: 'Rescheduled',
  NO_SHOW: 'No Show',
};

const BookingDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, role } = useAuth();
  const isTrainer = role === 'TRAINER';
  const { data: booking, isLoading } = useBooking(id ?? '');

  const confirmBooking = useConfirmBooking();
  const declineBooking = useDeclineBooking();
  const cancelBooking = useCancelBooking();
  const completeBooking = useCompleteBooking();
  const noShowBooking = useNoShowBooking();

  if (isLoading || !booking) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Skeleton className="h-5 w-32 rounded" />
        </View>
        <View className="px-4 py-6 gap-4">
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </View>
      </SafeAreaView>
    );
  }

  const otherName = isTrainer
    ? (booking as any).clientRoster?.client?.user?.name ?? 'Client'
    : (booking as any).trainer?.displayName ?? 'Trainer';
  const date = new Date(booking.date);
  const dateStr = date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const isVideo = booking.sessionType === 'VIDEO_CALL';
  const isPending = booking.status === 'PENDING';
  const isConfirmed = booking.status === 'CONFIRMED';
  const iAmInitiator = booking.initiatedBy === user?.id;
  const canConfirm = isPending && !iAmInitiator;
  const canDecline = isPending && !iAmInitiator;
  const canCancel = isPending || isConfirmed;
  const canComplete = isConfirmed && isTrainer;
  const canNoShow = isConfirmed && isTrainer;

  const handleConfirm = () => {
    Alert.alert('Confirm Booking', `Confirm this session with ${otherName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => confirmBooking.mutate({ id: booking.id }, { onSuccess: () => router.back() }) },
    ]);
  };

  const handleDecline = () => {
    Alert.alert('Decline Booking', 'Are you sure you want to decline?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: () => declineBooking.mutate({ id: booking.id }, { onSuccess: () => router.back() }) },
    ]);
  };

  const handleCancel = () => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel?', [
      { text: 'No', style: 'cancel' },
      { text: 'Cancel Booking', style: 'destructive', onPress: () => cancelBooking.mutate({ id: booking.id }, { onSuccess: () => router.back() }) },
    ]);
  };

  const handleComplete = () => {
    completeBooking.mutate({ id: booking.id }, { onSuccess: () => router.back() });
  };

  const handleNoShow = () => {
    Alert.alert('Mark No Show', 'Mark this client as a no-show?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'No Show', style: 'destructive', onPress: () => noShowBooking.mutate({ id: booking.id }, { onSuccess: () => router.back() }) },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">Booking Details</Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-4 pb-8">
        {/* Status */}
        <View className="items-center gap-2">
          <Badge variant={booking.status === 'CONFIRMED' ? 'default' : 'secondary'}>
            {STATUS_LABELS[booking.status] ?? booking.status}
          </Badge>
        </View>

        {/* Details */}
        <Card>
          <CardContent className="py-4 px-4 gap-3">
            <View className="flex-row items-center gap-2">
              <User size={18} color={colors.teal} />
              <Text className="text-base font-semibold text-foreground">{otherName}</Text>
            </View>

            <View className="flex-row items-center gap-2">
              <Calendar size={16} color={colors.mutedForeground} />
              <Text className="text-sm text-foreground">{dateStr}</Text>
            </View>

            <View className="flex-row items-center gap-2">
              <Clock size={16} color={colors.mutedForeground} />
              <Text className="text-sm text-foreground">
                {booking.startTime} - {booking.endTime} ({booking.durationMin} min)
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              {isVideo ? (
                <Video size={16} color={colors.teal} />
              ) : (
                <MapPin size={16} color={colors.mutedForeground} />
              )}
              <Text className="text-sm text-foreground">
                {isVideo ? 'Video Call' : ((booking as any).location?.name ?? 'In Person')}
              </Text>
            </View>
          </CardContent>
        </Card>

        {/* Notes */}
        {booking.notes && (
          <Card>
            <CardContent className="py-4 px-4 gap-2">
              <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>
                Notes
              </Text>
              <Text className="text-sm text-foreground">{booking.notes}</Text>
            </CardContent>
          </Card>
        )}

        {/* Cancellation/Decline reason */}
        {(booking.cancellationReason || booking.declineReason) && (
          <Card>
            <CardContent className="py-4 px-4 gap-2">
              <View className="flex-row items-center gap-2">
                <AlertTriangle size={16} color={colors.destructive} />
                <Text className="text-sm font-medium text-destructive">
                  {booking.cancellationReason ? 'Cancellation Reason' : 'Decline Reason'}
                </Text>
              </View>
              <Text className="text-sm text-foreground">
                {booking.cancellationReason ?? booking.declineReason}
              </Text>
            </CardContent>
          </Card>
        )}

        {/* Video call join button */}
        {isVideo && isConfirmed && (booking as any).dailyRoomUrl && (
          <Button onPress={() => Linking.openURL((booking as any).dailyRoomUrl)}>
            Join Video Call
          </Button>
        )}

        {/* Actions */}
        {canConfirm && (
          <Button onPress={handleConfirm} loading={confirmBooking.isPending}>
            <View className="flex-row items-center gap-2">
              <CheckCircle size={18} color="#fff" />
              <Text className="text-white font-semibold">Confirm Booking</Text>
            </View>
          </Button>
        )}

        {canDecline && (
          <Button variant="destructive" onPress={handleDecline} loading={declineBooking.isPending}>
            <View className="flex-row items-center gap-2">
              <XCircle size={18} color="#fff" />
              <Text className="text-white font-semibold">Decline</Text>
            </View>
          </Button>
        )}

        {canComplete && (
          <Button onPress={handleComplete} loading={completeBooking.isPending}>
            Mark as Complete
          </Button>
        )}

        {canNoShow && (
          <Button variant="outline" onPress={handleNoShow} loading={noShowBooking.isPending}>
            Mark No Show
          </Button>
        )}

        {canCancel && (
          <Button variant="ghost" onPress={handleCancel} loading={cancelBooking.isPending}>
            <Text className="text-destructive font-semibold">Cancel Booking</Text>
          </Button>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default BookingDetailScreen;
