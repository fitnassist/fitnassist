import { Settings } from 'lucide-react';
import { ResponsiveTabs, TabsContent } from '@/components/ui';
import { PageLayout } from '@/components/layouts';
import { useTabParam, useAuth } from '@/hooks';
import { AccountTab, NotificationsTab, DangerZoneTab, SubscriptionTab, SchedulingTab, PaymentsTab, IntegrationsTab } from './components';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { UpgradePrompt } from '@/components/UpgradePrompt';

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useTabParam('account');
  const { isTrainer } = useAuth();

  const { hasAccess: hasBookingAccess } = useFeatureAccess('booking');
  const { hasAccess: hasPaymentsAccess } = useFeatureAccess('sessionPayments');

  const tabOptions = [
    { value: 'account', label: 'Account' },
    { value: 'notifications', label: 'Notifications' },
    ...(isTrainer ? [{ value: 'subscription', label: 'Subscription' }] : []),
    ...(isTrainer ? [{ value: 'scheduling', label: 'Scheduling' }] : []),
    ...(isTrainer ? [{ value: 'payments', label: 'Payments' }] : []),
    ...(!isTrainer ? [{ value: 'integrations', label: 'Integrations' }] : []),
    { value: 'danger', label: 'Danger Zone' },
  ];

  return (
    <PageLayout>
      <PageLayout.Header
        title="Settings"
        description="Manage your account settings and preferences"
        icon={<Settings className="h-6 w-6 sm:h-8 sm:w-8" />}
      />
      <ResponsiveTabs
        value={activeTab}
        onValueChange={setActiveTab}
        options={tabOptions}
        tabsListClassName="mb-6"
      >
        <TabsContent value="account">
          <AccountTab />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>
        {isTrainer && (
          <TabsContent value="subscription">
            <SubscriptionTab />
          </TabsContent>
        )}
        {isTrainer && (
          <TabsContent value="scheduling">
            {hasBookingAccess ? (
              <SchedulingTab />
            ) : (
              <UpgradePrompt requiredTier="PRO" featureName="Booking & Scheduling" />
            )}
          </TabsContent>
        )}
        {isTrainer && (
          <TabsContent value="payments">
            {hasPaymentsAccess ? (
              <PaymentsTab />
            ) : (
              <UpgradePrompt requiredTier="ELITE" featureName="Session Payments" />
            )}
          </TabsContent>
        )}
        {!isTrainer && (
          <TabsContent value="integrations">
            <IntegrationsTab />
          </TabsContent>
        )}
        <TabsContent value="danger">
          <DangerZoneTab />
        </TabsContent>
      </ResponsiveTabs>
    </PageLayout>
  );
};

export default SettingsPage;
