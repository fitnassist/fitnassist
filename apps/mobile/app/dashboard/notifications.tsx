import { useState } from 'react';
import { View, ScrollView, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Button, Input, Card, CardContent, Skeleton } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { colors } from '@/constants/theme';

interface ToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onToggle: (val: boolean) => void;
}

const ToggleRow = ({ label, description, value, onToggle }: ToggleRowProps) => (
  <View className="flex-row items-center justify-between py-3">
    <View className="flex-1 mr-4 gap-0.5">
      <Text className="text-sm text-foreground">{label}</Text>
      {description && <Text className="text-xs text-muted-foreground">{description}</Text>}
    </View>
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
  const { role } = useAuth();
  const isTrainer = role === 'TRAINER';
  const { data: prefs, isLoading } = trpc.user.getNotificationPreferences.useQuery();
  const update = trpc.user.updateNotificationPreferences.useMutation({
    onError: () => Alert.alert('Error', 'Failed to update preferences'),
  });
  const updatePhone = trpc.user.updatePhoneNumber.useMutation();
  const utils = trpc.useUtils();

  const [phone, setPhone] = useState('');

  const toggle = (key: string, value: boolean) => {
    if (!prefs) return;
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
        {/* Email Notifications */}
        <Card>
          <CardContent className="py-3 px-4">
            <Text className="text-sm font-medium text-teal uppercase mb-1" style={{ letterSpacing: 1 }}>
              Email Notifications
            </Text>
            <Text className="text-xs text-muted-foreground mb-2">Receive updates and alerts via email.</Text>
            <ToggleRow label="Connection requests" description="When someone sends you a connection request" value={prefs.emailNotifyConnectionRequests} onToggle={(v) => toggle('emailNotifyConnectionRequests', v)} />
            <Divider />
            <ToggleRow label="New messages" description="When you receive a new message" value={prefs.emailNotifyMessages} onToggle={(v) => toggle('emailNotifyMessages', v)} />
            <Divider />
            <ToggleRow label="Marketing & updates" description="Product updates, tips, and promotions" value={prefs.emailNotifyMarketing} onToggle={(v) => toggle('emailNotifyMarketing', v)} />
            <Divider />
            <ToggleRow
              label={isTrainer ? 'Weekly client reports' : 'Weekly progress summary'}
              description={isTrainer ? 'Summary of client activity and bookings' : 'Your weekly fitness progress overview'}
              value={prefs.emailNotifyWeeklyReport}
              onToggle={(v) => toggle('emailNotifyWeeklyReport', v)}
            />
            <Divider />
            <ToggleRow label="Booking confirmations" description="When a booking is confirmed or updated" value={prefs.emailNotifyBookings} onToggle={(v) => toggle('emailNotifyBookings', v)} />
            <Divider />
            <ToggleRow label="Booking reminders" description="Reminders before upcoming sessions" value={prefs.emailNotifyBookingReminders} onToggle={(v) => toggle('emailNotifyBookingReminders', v)} />
          </CardContent>
        </Card>

        {/* SMS Notifications */}
        <Card>
          <CardContent className="py-3 px-4">
            <Text className="text-sm font-medium text-teal uppercase mb-1" style={{ letterSpacing: 1 }}>
              SMS Notifications
            </Text>
            <Text className="text-xs text-muted-foreground mb-2">Receive important notifications via text message. Standard rates may apply.</Text>
            <ToggleRow label="Connection requests" value={prefs.smsNotifyConnectionRequests} onToggle={(v) => toggle('smsNotifyConnectionRequests', v)} />
            <Divider />
            <ToggleRow label="New messages" value={prefs.smsNotifyMessages} onToggle={(v) => toggle('smsNotifyMessages', v)} />
            <Divider />
            <ToggleRow label="Booking confirmations" value={prefs.smsNotifyBookings} onToggle={(v) => toggle('smsNotifyBookings', v)} />
            <Divider />
            <ToggleRow label="Booking reminders" value={prefs.smsNotifyBookingReminders} onToggle={(v) => toggle('smsNotifyBookingReminders', v)} />
            <Divider />
            <View className="py-3 gap-2">
              <Input label="Phone Number" value={phone} onChangeText={setPhone} placeholder="+447123456789" keyboardType="phone-pad" />
              <Button size="sm" variant="outline" onPress={() => {
                if (!phone.match(/^\+[1-9]\d{6,14}$/)) { Alert.alert('Error', 'Enter a valid phone number in E.164 format (e.g. +447123456789)'); return; }
                updatePhone.mutate({ phoneNumber: phone }, {
                  onSuccess: () => Alert.alert('Success', 'Phone number updated'),
                  onError: () => Alert.alert('Error', 'Failed to update phone number'),
                });
              }} loading={updatePhone.isPending}>Save Phone Number</Button>
            </View>
          </CardContent>
        </Card>

        {/* Push Notifications */}
        <Card>
          <CardContent className="py-3 px-4">
            <Text className="text-sm font-medium text-teal uppercase mb-1" style={{ letterSpacing: 1 }}>
              Push Notifications
            </Text>
            <Text className="text-xs text-muted-foreground mb-2">Controls both browser and mobile push notifications.</Text>
            <ToggleRow label="Connection requests" description="When someone sends you a connection request" value={prefs.pushNotifyConnectionRequests} onToggle={(v) => toggle('pushNotifyConnectionRequests', v)} />
            <Divider />
            <ToggleRow label="New messages" description="When you receive a new message" value={prefs.pushNotifyMessages} onToggle={(v) => toggle('pushNotifyMessages', v)} />
            <Divider />
            <ToggleRow label="Bookings" description="Booking requests and confirmations" value={prefs.pushNotifyBookings} onToggle={(v) => toggle('pushNotifyBookings', v)} />
            <Divider />
            <ToggleRow label="Booking reminders" description="Reminders before upcoming sessions" value={prefs.pushNotifyBookingReminders} onToggle={(v) => toggle('pushNotifyBookingReminders', v)} />
            <Divider />
            <ToggleRow label="Plan assignments" description="When a trainer assigns you a new plan" value={prefs.pushNotifyPlanAssignments} onToggle={(v) => toggle('pushNotifyPlanAssignments', v)} />
            <Divider />
            <ToggleRow label="Onboarding" description="Onboarding form updates" value={prefs.pushNotifyOnboarding} onToggle={(v) => toggle('pushNotifyOnboarding', v)} />
            <Divider />
            <ToggleRow label="Diary comments" description="When a trainer comments on your diary entries" value={prefs.pushNotifyDiary} onToggle={(v) => toggle('pushNotifyDiary', v)} />
            <Divider />
            <ToggleRow label="Goals" description="Goal progress and completion updates" value={prefs.pushNotifyGoals} onToggle={(v) => toggle('pushNotifyGoals', v)} />
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationsScreen;
