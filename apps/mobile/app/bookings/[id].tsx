import { useState, useEffect, useRef } from "react";
import { View, ScrollView, Linking, Modal } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
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
} from "lucide-react-native";
import { TouchableOpacity } from "react-native";
import {
  Text,
  Button,
  Card,
  CardContent,
  Skeleton,
  Badge,
  useAlert,
} from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { Calendar as RNCalendar } from "react-native-calendars";
import {
  useBooking,
  useConfirmBooking,
  useDeclineBooking,
  useCancelBooking,
  useCompleteBooking,
  useNoShowBooking,
  useRescheduleBooking,
} from "@/api/booking";
import { useAvailableSlots } from "@/api/availability";
import { Input } from "@/components/ui";
import { colors } from "@/constants/theme";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  DECLINED: "Declined",
  CANCELLED_BY_TRAINER: "Cancelled by Trainer",
  CANCELLED_BY_CLIENT: "Cancelled by Client",
  RESCHEDULED: "Rescheduled",
  NO_SHOW: "No Show",
};

const BookingDetailScreen = () => {
  const { showAlert } = useAlert();
  const { id, payment } = useLocalSearchParams<{
    id: string;
    payment?: string;
  }>();
  const router = useRouter();
  const { user, role } = useAuth();
  const isTrainer = role === "TRAINER";
  const { data: booking, isLoading, refetch } = useBooking(id ?? "");
  const hasHandledPayment = useRef(false);

  useEffect(() => {
    if (!payment || hasHandledPayment.current) return;
    hasHandledPayment.current = true;

    if (payment === "success") {
      refetch();
      showAlert({
        title: "Payment Confirmed",
        message: "Your payment has been processed successfully.",
      });
    } else if (payment === "cancelled") {
      showAlert({
        title: "Payment Not Completed",
        message:
          "Payment was not completed. You can pay later from your booking.",
      });
    }
  }, [payment]);

  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlot, setRescheduleSlot] = useState<any>(null);
  const confirmBooking = useConfirmBooking();
  const declineBooking = useDeclineBooking();
  const cancelBooking = useCancelBooking();
  const completeBooking = useCompleteBooking();
  const noShowBooking = useNoShowBooking();
  const rescheduleBooking = useRescheduleBooking();

  const trainerId = (booking as any)?.trainerId ?? "";
  const { data: rescheduleSlots } = useAvailableSlots(
    trainerId,
    rescheduleDate,
  );

  const handleReschedule = () => {
    if (!rescheduleSlot || !id) return;
    rescheduleBooking.mutate(
      {
        id,
        date: rescheduleDate,
        startTime: rescheduleSlot.startTime,
        durationMin: rescheduleSlot.durationMin,
      },
      {
        onSuccess: () => {
          setShowReschedule(false);
          router.back();
        },
      },
    );
  };

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
    ? ((booking as any).clientRoster?.connection?.sender?.name ??
      (booking as any).clientRoster?.connection?.name ??
      "Client")
    : ((booking as any).trainer?.displayName ?? "Trainer");
  const date = new Date(booking.date);
  const dateStr = date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const isVideo = booking.sessionType === "VIDEO_CALL";
  const isPending = booking.status === "PENDING";
  const isConfirmed = booking.status === "CONFIRMED";
  const iAmInitiator = booking.initiatedBy === user?.id;
  const canConfirm = isPending && !iAmInitiator;
  const canDecline = isPending && !iAmInitiator;
  const canCancel = isPending || isConfirmed;
  const canComplete = isConfirmed && isTrainer;
  const canNoShow = isConfirmed && isTrainer;

  const handleConfirm = () => {
    showAlert({
      title: "Confirm Booking",
      message: `Confirm this session with ${otherName}?`,
      actions: [
        {
          label: "Confirm",
          onPress: () =>
            confirmBooking.mutate(
              { id: booking.id },
              { onSuccess: () => router.back() },
            ),
        },
        { label: "Cancel", variant: "outline" },
      ],
    });
  };

  const handleDecline = () => {
    showAlert({
      title: "Decline Booking",
      message: "Are you sure you want to decline?",
      actions: [
        {
          label: "Decline",
          variant: "destructive",
          onPress: () =>
            declineBooking.mutate(
              { id: booking.id },
              { onSuccess: () => router.back() },
            ),
        },
        { label: "Cancel", variant: "outline" },
      ],
    });
  };

  const handleCancel = () => {
    showAlert({
      title: "Cancel Booking",
      message: "Are you sure you want to cancel?",
      actions: [
        {
          label: "Cancel Booking",
          variant: "destructive",
          onPress: () =>
            cancelBooking.mutate(
              { id: booking.id },
              { onSuccess: () => router.back() },
            ),
        },
        { label: "No", variant: "outline" },
      ],
    });
  };

  const handleComplete = () => {
    completeBooking.mutate(
      { id: booking.id },
      { onSuccess: () => router.back() },
    );
  };

  const handleNoShow = () => {
    showAlert({
      title: "Mark No Show",
      message: "Mark this client as a no-show?",
      actions: [
        {
          label: "No Show",
          variant: "destructive",
          onPress: () =>
            noShowBooking.mutate(
              { id: booking.id },
              { onSuccess: () => router.back() },
            ),
        },
        { label: "Cancel", variant: "outline" },
      ],
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">
          Booking Details
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4 gap-4 pb-8"
      >
        {/* Status */}
        <View className="items-center gap-2">
          <Badge
            variant={booking.status === "CONFIRMED" ? "default" : "secondary"}
          >
            {STATUS_LABELS[booking.status] ?? booking.status}
          </Badge>
        </View>

        {/* Details */}
        <Card>
          <CardContent className="py-4 px-4 gap-3">
            <View className="flex-row items-center gap-2">
              <User size={18} color={colors.teal} />
              <Text className="text-base font-semibold text-foreground">
                {otherName}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <Calendar size={16} color={colors.mutedForeground} />
              <Text className="text-sm text-foreground">{dateStr}</Text>
            </View>

            <View className="flex-row items-center gap-2">
              <Clock size={16} color={colors.mutedForeground} />
              <Text className="text-sm text-foreground">
                {booking.startTime} - {booking.endTime} ({booking.durationMin}{" "}
                min)
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              {isVideo ? (
                <Video size={16} color={colors.teal} />
              ) : (
                <MapPin size={16} color={colors.mutedForeground} />
              )}
              <Text className="text-sm text-foreground">
                {isVideo
                  ? "Video Call"
                  : ((booking as any).location?.name ?? "In Person")}
              </Text>
            </View>
          </CardContent>
        </Card>

        {/* Notes */}
        {booking.notes && (
          <Card>
            <CardContent className="py-4 px-4 gap-2">
              <Text
                className="text-sm font-medium text-teal uppercase"
                style={{ letterSpacing: 1 }}
              >
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
                  {booking.cancellationReason
                    ? "Cancellation Reason"
                    : "Decline Reason"}
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
          <Button
            onPress={() => Linking.openURL((booking as any).dailyRoomUrl)}
          >
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
          <Button
            variant="destructive"
            onPress={handleDecline}
            loading={declineBooking.isPending}
          >
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
          <Button
            variant="outline"
            onPress={handleNoShow}
            loading={noShowBooking.isPending}
          >
            Mark No Show
          </Button>
        )}

        {(isPending || isConfirmed) && (
          <Button variant="outline" onPress={() => setShowReschedule(true)}>
            Reschedule
          </Button>
        )}

        {canCancel && (
          <Button
            variant="ghost"
            onPress={handleCancel}
            loading={cancelBooking.isPending}
          >
            <Text className="text-destructive font-semibold">
              Cancel Booking
            </Text>
          </Button>
        )}

        {/* Reschedule Modal */}
        <Modal
          visible={showReschedule}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowReschedule(false)}
        >
          <SafeAreaView className="flex-1 bg-background">
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
              <Text className="text-base font-semibold text-foreground">
                Reschedule
              </Text>
              <TouchableOpacity onPress={() => setShowReschedule(false)}>
                <ArrowLeft size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <ScrollView
              className="flex-1"
              contentContainerClassName="px-4 py-4 gap-4 pb-8"
            >
              <RNCalendar
                minDate={new Date().toISOString().split("T")[0]}
                onDayPress={(day: { dateString: string }) => {
                  setRescheduleDate(day.dateString);
                  setRescheduleSlot(null);
                }}
                markedDates={
                  rescheduleDate
                    ? {
                        [rescheduleDate]: {
                          selected: true,
                          selectedColor: colors.primary,
                        },
                      }
                    : {}
                }
                theme={{
                  calendarBackground: "transparent",
                  todayTextColor: colors.teal,
                  dayTextColor: colors.foreground,
                  textDisabledColor: colors.muted,
                  arrowColor: colors.teal,
                  monthTextColor: colors.foreground,
                  selectedDayBackgroundColor: colors.primary,
                  selectedDayTextColor: "#fff",
                }}
              />
              {rescheduleDate && rescheduleSlots && (
                <View className="flex-row flex-wrap gap-2">
                  {(rescheduleSlots as any[]).map((slot: any) => (
                    <TouchableOpacity
                      key={slot.startTime}
                      className={`px-4 py-3 rounded-lg border ${rescheduleSlot?.startTime === slot.startTime ? "border-teal bg-teal/10" : "border-border bg-card"}`}
                      onPress={() => setRescheduleSlot(slot)}
                    >
                      <Text
                        className={`text-sm ${rescheduleSlot?.startTime === slot.startTime ? "text-teal font-semibold" : "text-foreground"}`}
                      >
                        {slot.startTime} - {slot.endTime}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <Button
                onPress={handleReschedule}
                disabled={!rescheduleSlot}
                loading={rescheduleBooking.isPending}
              >
                Confirm Reschedule
              </Button>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BookingDetailScreen;
