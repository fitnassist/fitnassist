import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, MessageSquare, Bell, Phone } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  SkeletonText,
  Switch,
  Separator,
} from '@/components/ui';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  useUpdatePhoneNumber,
} from '@/api/user';
import {
  notificationPreferencesSchema,
  type NotificationPreferencesInput,
} from '@fitnassist/schemas';
import { useAuth } from '@/hooks';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from '@/lib/toast';

export const NotificationsTab = () => {
  const { isTrainer } = useAuth();
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updateMutation = useUpdateNotificationPreferences();
  const updatePhoneMutation = useUpdatePhoneNumber();
  const { isSupported, permission, requestPermission, isEnabled, isConfigured } = usePushNotifications();
  const [isEnabling, setIsEnabling] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneSaved, setPhoneSaved] = useState(false);

  const form = useForm<NotificationPreferencesInput>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: {
      emailNotifyConnectionRequests: true,
      emailNotifyMessages: true,
      emailNotifyMarketing: false,
      emailNotifyWeeklyReport: true,
      emailNotifyBookings: true,
      emailNotifyBookingReminders: true,
      smsNotifyConnectionRequests: false,
      smsNotifyMessages: false,
      smsNotifyBookings: false,
      smsNotifyBookingReminders: false,
      pushNotifyConnectionRequests: true,
      pushNotifyMessages: true,
      pushNotifyBookings: true,
      pushNotifyBookingReminders: true,
      pushNotifyPlanAssignments: true,
      pushNotifyOnboarding: true,
      pushNotifyDiary: true,
      pushNotifyGoals: true,
    },
  });

  useEffect(() => {
    if (preferences) {
      const { phoneNumber: phone, ...prefs } = preferences;
      form.reset(prefs);
      setPhoneNumber(phone ?? '');
      setPhoneSaved(!!phone);
    }
  }, [preferences, form]);

  const onSubmit = async (data: NotificationPreferencesInput) => {
    await updateMutation.mutateAsync(data);
    toast.success('Notification preferences updated');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6 space-y-4">
              <SkeletonText className="w-40" />
              <SkeletonText className="w-64" />
              <div className="space-y-3">
                <SkeletonText />
                <SkeletonText />
                <SkeletonText />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {updateMutation.isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          Failed to update preferences. Please try again.
        </div>
      )}

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Choose which notifications you want to receive via email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNotifyConnectionRequests">Connection Requests</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when someone wants to connect with you.
              </p>
            </div>
            <Switch
              id="emailNotifyConnectionRequests"
              checked={form.watch('emailNotifyConnectionRequests')}
              onCheckedChange={(checked) =>
                form.setValue('emailNotifyConnectionRequests', checked)
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNotifyMessages">New Messages</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when you receive a new message.
              </p>
            </div>
            <Switch
              id="emailNotifyMessages"
              checked={form.watch('emailNotifyMessages')}
              onCheckedChange={(checked) => form.setValue('emailNotifyMessages', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNotifyMarketing">Marketing & Updates</Label>
              <p className="text-sm text-muted-foreground">
                Receive news, tips, and promotional content.
              </p>
            </div>
            <Switch
              id="emailNotifyMarketing"
              checked={form.watch('emailNotifyMarketing')}
              onCheckedChange={(checked) => form.setValue('emailNotifyMarketing', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNotifyWeeklyReport">
                {isTrainer ? 'Weekly client reports' : 'Weekly progress summary'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {isTrainer
                  ? "Receive a weekly email summarising your clients' activity."
                  : 'Receive a weekly email summarising your progress.'}
              </p>
            </div>
            <Switch
              id="emailNotifyWeeklyReport"
              checked={form.watch('emailNotifyWeeklyReport')}
              onCheckedChange={(checked) => form.setValue('emailNotifyWeeklyReport', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNotifyBookings">Booking Confirmations</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when a session is booked or cancelled.
              </p>
            </div>
            <Switch
              id="emailNotifyBookings"
              checked={form.watch('emailNotifyBookings')}
              onCheckedChange={(checked) => form.setValue('emailNotifyBookings', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNotifyBookingReminders">Booking Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Receive a reminder 24 hours before your session.
              </p>
            </div>
            <Switch
              id="emailNotifyBookingReminders"
              checked={form.watch('emailNotifyBookingReminders')}
              onCheckedChange={(checked) => form.setValue('emailNotifyBookingReminders', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* SMS Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS Notifications
          </CardTitle>
          <CardDescription>
            Receive important notifications via text message. Standard rates may apply.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number
            </Label>
            <p className="text-sm text-muted-foreground">
              Enter your phone number in international format (e.g. +44 7700 900000).
            </p>
            <div className="flex gap-2">
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+44 7700 900000"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setPhoneSaved(false);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={updatePhoneMutation.isPending || phoneSaved}
                onClick={async () => {
                  const cleaned = phoneNumber.replace(/\s/g, '');
                  if (cleaned && !/^\+[1-9]\d{1,14}$/.test(cleaned)) {
                    toast.error('Please enter a valid phone number in international format (e.g. +44...)');
                    return;
                  }
                  await updatePhoneMutation.mutateAsync({ phoneNumber: cleaned || null });
                  setPhoneSaved(true);
                  toast.success(cleaned ? 'Phone number saved' : 'Phone number removed');
                }}
              >
                {updatePhoneMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {phoneSaved ? 'Saved' : 'Save'}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="smsNotifyConnectionRequests">Connection Requests</Label>
              <p className="text-sm text-muted-foreground">
                Get a text when someone wants to connect.
              </p>
            </div>
            <Switch
              id="smsNotifyConnectionRequests"
              checked={form.watch('smsNotifyConnectionRequests')}
              onCheckedChange={(checked) =>
                form.setValue('smsNotifyConnectionRequests', checked)
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="smsNotifyMessages">New Messages</Label>
              <p className="text-sm text-muted-foreground">
                Get a text when you receive a new message.
              </p>
            </div>
            <Switch
              id="smsNotifyMessages"
              checked={form.watch('smsNotifyMessages')}
              onCheckedChange={(checked) => form.setValue('smsNotifyMessages', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="smsNotifyBookings">Booking Confirmations</Label>
              <p className="text-sm text-muted-foreground">
                Get a text when a session is booked, cancelled, or rescheduled.
              </p>
            </div>
            <Switch
              id="smsNotifyBookings"
              checked={form.watch('smsNotifyBookings')}
              onCheckedChange={(checked) => form.setValue('smsNotifyBookings', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="smsNotifyBookingReminders">Booking Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get a text reminder 24 hours before your session.
              </p>
            </div>
            <Switch
              id="smsNotifyBookingReminders"
              checked={form.watch('smsNotifyBookingReminders')}
              onCheckedChange={(checked) => form.setValue('smsNotifyBookingReminders', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Browser Push Notifications
          </CardTitle>
          <CardDescription>
            Receive notifications even when you're not on the site.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSupported && !isEnabled && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <p className="text-sm">
                {permission === 'denied'
                  ? 'Push notifications are blocked. Enable them in your browser settings.'
                  : 'Enable browser notifications to stay up to date.'}
              </p>
              {permission !== 'denied' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isEnabling}
                  onClick={async () => {
                    setIsEnabling(true);
                    try {
                      await requestPermission();
                    } finally {
                      setIsEnabling(false);
                    }
                  }}
                >
                  {isEnabling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enable
                </Button>
              )}
            </div>
          )}

          {isSupported && isEnabled && !isConfigured && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
              Browser permissions granted but push notifications are not yet configured on the server.
            </div>
          )}

          {!isSupported && (
            <p className="text-sm text-muted-foreground">
              Push notifications are not supported in this browser.
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pushNotifyConnectionRequests">Connection Requests</Label>
              <p className="text-sm text-muted-foreground">
                Get push notifications for connection requests.
              </p>
            </div>
            <Switch
              id="pushNotifyConnectionRequests"
              checked={form.watch('pushNotifyConnectionRequests')}
              onCheckedChange={(checked) =>
                form.setValue('pushNotifyConnectionRequests', checked)
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pushNotifyMessages">New Messages</Label>
              <p className="text-sm text-muted-foreground">
                Get push notifications for new messages.
              </p>
            </div>
            <Switch
              id="pushNotifyMessages"
              checked={form.watch('pushNotifyMessages')}
              onCheckedChange={(checked) => form.setValue('pushNotifyMessages', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pushNotifyBookings">Bookings</Label>
              <p className="text-sm text-muted-foreground">
                Get push notifications for booking confirmations and cancellations.
              </p>
            </div>
            <Switch
              id="pushNotifyBookings"
              checked={form.watch('pushNotifyBookings')}
              onCheckedChange={(checked) => form.setValue('pushNotifyBookings', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pushNotifyBookingReminders">Booking Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get push reminders before sessions.
              </p>
            </div>
            <Switch
              id="pushNotifyBookingReminders"
              checked={form.watch('pushNotifyBookingReminders')}
              onCheckedChange={(checked) => form.setValue('pushNotifyBookingReminders', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pushNotifyPlanAssignments">Plan Assignments</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when plans are assigned or removed.
              </p>
            </div>
            <Switch
              id="pushNotifyPlanAssignments"
              checked={form.watch('pushNotifyPlanAssignments')}
              onCheckedChange={(checked) => form.setValue('pushNotifyPlanAssignments', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pushNotifyOnboarding">Onboarding</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about onboarding form submissions and reviews.
              </p>
            </div>
            <Switch
              id="pushNotifyOnboarding"
              checked={form.watch('pushNotifyOnboarding')}
              onCheckedChange={(checked) => form.setValue('pushNotifyOnboarding', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pushNotifyDiary">Diary Comments</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when someone comments on diary entries.
              </p>
            </div>
            <Switch
              id="pushNotifyDiary"
              checked={form.watch('pushNotifyDiary')}
              onCheckedChange={(checked) => form.setValue('pushNotifyDiary', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pushNotifyGoals">Goals</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when goals are completed.
              </p>
            </div>
            <Switch
              id="pushNotifyGoals"
              checked={form.watch('pushNotifyGoals')}
              onCheckedChange={(checked) => form.setValue('pushNotifyGoals', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Preferences
        </Button>
      </div>
    </form>
  );
};
