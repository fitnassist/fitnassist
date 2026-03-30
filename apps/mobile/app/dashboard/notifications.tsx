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

const Divider = () => <View className="border-b border-border" />;

const NotificationsScreen = () => {
  const router = useRouter();
  const { data: prefs, isLoading } = trpc.user.getNotificationPreferences.useQuery();
  const update = trpc.user.updateNotificationPreferences.useMutation({
    onError: () => Alert.alert('Error', 'Failed to update preferences'),
  });
  const utils = trpc.useUtils();

  const toggle = (key: string, value: boolean) => {
    if (!prefs) return;
    // Send full object with the toggled field
    const updated = { ...prefs, [key]: value };
    utils.user.getNotificationPreferences.setData(undefined, updated);
    update.mutate(updated as any);
  };

  if (isLoading || !prefs) {
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
            <ToggleRow label="Connection requests" value={prefs.pushNotifyConnectionRequests} onToggle={(v) => toggle('pushNotifyConnectionRequests', v)} />
            <Divider />
            <ToggleRow label="Messages" value={prefs.pushNotifyMessages} onToggle={(v) => toggle('pushNotifyMessages', v)} />
            <Divider />
            <ToggleRow label="Bookings" value={prefs.pushNotifyBookings} onToggle={(v) => toggle('pushNotifyBookings', v)} />
            <Divider />
            <ToggleRow label="Booking reminders" value={prefs.pushNotifyBookingReminders} onToggle={(v) => toggle('pushNotifyBookingReminders', v)} />
            <Divider />
            <ToggleRow label="Plan assignments" value={prefs.pushNotifyPlanAssignments} onToggle={(v) => toggle('pushNotifyPlanAssignments', v)} />
            <Divider />
            <ToggleRow label="Goals" value={prefs.pushNotifyGoals} onToggle={(v) => toggle('pushNotifyGoals', v)} />
            <Divider />
            <ToggleRow label="Onboarding" value={prefs.pushNotifyOnboarding} onToggle={(v) => toggle('pushNotifyOnboarding', v)} />
            <Divider />
            <ToggleRow label="Diary updates" value={prefs.pushNotifyDiary} onToggle={(v) => toggle('pushNotifyDiary', v)} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-3 px-4">
            <Text className="text-sm font-medium text-teal uppercase mb-2" style={{ letterSpacing: 1 }}>
              Email Notifications
            </Text>
            <ToggleRow label="Connection requests" value={prefs.emailNotifyConnectionRequests} onToggle={(v) => toggle('emailNotifyConnectionRequests', v)} />
            <Divider />
            <ToggleRow label="Messages" value={prefs.emailNotifyMessages} onToggle={(v) => toggle('emailNotifyMessages', v)} />
            <Divider />
            <ToggleRow label="Bookings" value={prefs.emailNotifyBookings} onToggle={(v) => toggle('emailNotifyBookings', v)} />
            <Divider />
            <ToggleRow label="Booking reminders" value={prefs.emailNotifyBookingReminders} onToggle={(v) => toggle('emailNotifyBookingReminders', v)} />
            <Divider />
            <ToggleRow label="Weekly report" value={prefs.emailNotifyWeeklyReport} onToggle={(v) => toggle('emailNotifyWeeklyReport', v)} />
            <Divider />
            <ToggleRow label="Marketing" value={prefs.emailNotifyMarketing} onToggle={(v) => toggle('emailNotifyMarketing', v)} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-3 px-4">
            <Text className="text-sm font-medium text-teal uppercase mb-2" style={{ letterSpacing: 1 }}>
              SMS Notifications
            </Text>
            <ToggleRow label="Connection requests" value={prefs.smsNotifyConnectionRequests} onToggle={(v) => toggle('smsNotifyConnectionRequests', v)} />
            <Divider />
            <ToggleRow label="Messages" value={prefs.smsNotifyMessages} onToggle={(v) => toggle('smsNotifyMessages', v)} />
            <Divider />
            <ToggleRow label="Bookings" value={prefs.smsNotifyBookings} onToggle={(v) => toggle('smsNotifyBookings', v)} />
            <Divider />
            <ToggleRow label="Booking reminders" value={prefs.smsNotifyBookingReminders} onToggle={(v) => toggle('smsNotifyBookingReminders', v)} />
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationsScreen;
