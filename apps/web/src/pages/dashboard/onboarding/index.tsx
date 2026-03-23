import { ClipboardCheck, FileText, Eye } from 'lucide-react';
import { ResponsiveTabs, TabsContent } from '@/components/ui';
import { PageLayout } from '@/components/layouts';
import { useTabParam } from '@/hooks';
import { useOnboardingStats } from '@/api/onboarding';
import { TemplateList, PendingReviewList } from './components';

export const OnboardingPage = () => {
  const [activeTab, setActiveTab] = useTabParam('templates');
  const { data: stats } = useOnboardingStats();

  const pendingCount = stats?.submitted ?? 0;

  return (
    <PageLayout>
      <PageLayout.Header
        title="Client Onboarding"
        description="Manage onboarding templates and review client submissions."
        icon={<ClipboardCheck className="h-6 w-6 sm:h-8 sm:w-8" />}
      />
      <ResponsiveTabs
        value={activeTab}
        onValueChange={setActiveTab}
        options={[
          { value: 'templates', label: 'Templates', icon: <FileText className="h-4 w-4" /> },
          {
            value: 'review',
            label: `Pending Review${pendingCount > 0 ? ` (${pendingCount})` : ''}`,
            icon: <Eye className="h-4 w-4" />,
          },
        ]}
        tabsListClassName="mb-6"
      >
        <TabsContent value="templates">
          <TemplateList />
        </TabsContent>
        <TabsContent value="review">
          <PendingReviewList />
        </TabsContent>
      </ResponsiveTabs>
    </PageLayout>
  );
};

export default OnboardingPage;
