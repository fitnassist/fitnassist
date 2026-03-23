import { Settings } from 'lucide-react';
import { ResponsiveTabs, TabsContent } from '@/components/ui';
import { PageLayout } from '@/components/layouts';
import { useTabParam } from '@/hooks';
import { AccountTab, NotificationsTab, DangerZoneTab } from './components';

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useTabParam('account');

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
        options={[
          { value: 'account', label: 'Account' },
          { value: 'notifications', label: 'Notifications' },
          { value: 'danger', label: 'Danger Zone' },
        ]}
        tabsListClassName="mb-6"
      >
        <TabsContent value="account">
          <AccountTab />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>
        <TabsContent value="danger">
          <DangerZoneTab />
        </TabsContent>
      </ResponsiveTabs>
    </PageLayout>
  );
};

export default SettingsPage;
