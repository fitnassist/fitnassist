import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, MessageSquare, Bell } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  SkeletonText,
  Switch,
  Separator,
} from '@/components/ui';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/api/user';
import {
  notificationPreferencesSchema,
  type NotificationPreferencesInput,
} from '@fitnassist/schemas';
import { useAuth } from '@/hooks';

export const NotificationsTab = () => {
  const { isTrainer } = useAuth();
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updateMutation = useUpdateNotificationPreferences();

  const form = useForm<NotificationPreferencesInput>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: {
      emailNotifyConnectionRequests: true,
      emailNotifyMessages: true,
      emailNotifyMarketing: false,
      emailNotifyWeeklyReport: true,
      smsNotifyConnectionRequests: false,
      smsNotifyMessages: false,
      pushNotifyConnectionRequests: true,
      pushNotifyMessages: true,
    },
  });

  useEffect(() => {
    if (preferences) {
      form.reset(preferences);
    }
  }, [preferences, form]);

  const onSubmit = async (data: NotificationPreferencesInput) => {
    await updateMutation.mutateAsync(data);
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
      {updateMutation.isSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          Notification preferences updated successfully!
        </div>
      )}

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
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Receive notifications on your mobile device (coming soon).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
