import { View, ScrollView, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Card, CardContent, Skeleton } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { colors } from '@/constants/theme';

interface ToggleRowProps {
  label: string;
  value: boolean;
  onToggle: (val: boolean) => void;
}

const ToggleRow = ({ label, value, onToggle }: ToggleRowProps) => (
  <View className="flex-row items-center justify-between py-3">
    <Text className="text-sm text-foreground flex-1 mr-4">{label}</Text>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: colors.muted, true: colors.teal }}
      thumbColor="#fff"
    />
  </View>
);

const NotificationsScreen = () => {
  const router = useRouter();
  const { data: prefs, isLoading } = trpc.user.getNotificationPreferences.useQuery();
  const update = trpc.user.updateNotificationPreferences.useMutation({
    onError: () => Alert.alert('Error', 'Failed to update preferences'),
  });
  const utils = trpc.useUtils();

  const toggle = (key: string, value: boolean) => {
    utils.user.getNotificationPreferences.setData(undefined, (old) =>
      old ? { ...old, [key]: value } : old,
    );
    update.mutate({ [key]: value } as never);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-base font-semibold text-foreground">Notifications</Text>
        </View>
        <View className="px-4 py-4 gap-4">
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">Notifications</Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-4 pb-8">
        <Card>
          <CardContent className="py-3 px-4">
            <Text className="text-sm font-medium text-teal uppercase mb-2" style={{ letterSpacing: 1 }}>
              Push Notifications
            </Text>
            <ToggleRow
              label="Connection requests"
              value={prefs?.pushNotifyConnectionRequests ?? true}
              onToggle={(v) => toggle('pushNotifyConnectionRequests', v)}
            />
            <View className="border-b border-border" />
            <ToggleRow
              label="Messages"
              value={prefs?.pushNotifyMessages ?? true}
              onToggle={(v) => toggle('pushNotifyMessages', v)}
            />
            <View className="border-b border-border" />
            <ToggleRow
              label="Bookings"
              value={prefs?.pushNotifyBookings ?? true}
              onToggle={(v) => toggle('pushNotifyBookings', v)}
            />
            <View className="border-b border-border" />
            <ToggleRow
              label="Booking reminders"
              value={prefs?.pushNotifyBookingReminders ?? true}
              onToggle={(v) => toggle('pushNotifyBookingReminders', v)}
            />
            <View className="border-b border-border" />
            <ToggleRow
              label="Plan assignments"
              value={prefs?.pushNotifyPlanAssignments ?? true}
              onToggle={(v) => toggle('pushNotifyPlanAssignments', v)}
            />
            <View className="border-b border-border" />
            <ToggleRow
              label="Goals"
              value={prefs?.pushNotifyGoals ?? true}
              onToggle={(v) => toggle('pushNotifyGoals', v)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-3 px-4">
            <Text className="text-sm font-medium text-teal uppercase mb-2" style={{ letterSpacing: 1 }}>
              Email Notifications
            </Text>
            <ToggleRow
              label="Connection requests"
              value={prefs?.emailNotifyConnectionRequests ?? true}
              onToggle={(v) => toggle('emailNotifyConnectionRequests', v)}
            />
            <View className="border-b border-border" />
            <ToggleRow
              label="Messages"
              value={prefs?.emailNotifyMessages ?? true}
              onToggle={(v) => toggle('emailNotifyMessages', v)}
            />
            <View className="border-b border-border" />
            <ToggleRow
              label="Bookings"
              value={prefs?.emailNotifyBookings ?? true}
              onToggle={(v) => toggle('emailNotifyBookings', v)}
            />
            <View className="border-b border-border" />
            <ToggleRow
              label="Weekly report"
              value={prefs?.emailNotifyWeeklyReport ?? true}
              onToggle={(v) => toggle('emailNotifyWeeklyReport', v)}
            />
            <View className="border-b border-border" />
            <ToggleRow
              label="Marketing"
              value={prefs?.emailNotifyMarketing ?? false}
              onToggle={(v) => toggle('emailNotifyMarketing', v)}
            />
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationsScreen;
