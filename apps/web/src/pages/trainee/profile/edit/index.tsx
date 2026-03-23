import { User, Ruler, Dumbbell, Apple, Shield } from 'lucide-react';
import { ResponsiveTabs, TabsContent } from '@/components/ui';
import { PageLayout } from '@/components/layouts';
import { useTabParam } from '@/hooks';
import { routes } from '@/config/routes';
import { trpc } from '@/lib/trpc';
import { PersonalInfoTab, BodyMetricsTab, FitnessTab, NutritionTab, PrivacyTab } from './components';

export const TraineeProfileEditPage = () => {
  const [activeTab, setActiveTab] = useTabParam('personal');
  const { data: profile, isLoading } = trpc.trainee.getMyProfile.useQuery();

  if (isLoading) {
    return (
      <PageLayout maxWidth="3xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-4 w-64 bg-muted rounded" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout maxWidth="3xl">
      <PageLayout.Header
        title={profile ? 'Edit Profile' : 'Set Up Your Profile'}
        description={profile ? 'Update your profile information' : 'Help trainers understand your goals and fitness level. All fields are optional.'}
        backLink={{ to: routes.dashboard, label: 'Back to Dashboard' }}
      />
      <ResponsiveTabs
        value={activeTab}
        onValueChange={setActiveTab}
        options={[
          { value: 'personal', label: 'Personal', icon: <User className="h-4 w-4" /> },
          { value: 'metrics', label: 'Metrics', icon: <Ruler className="h-4 w-4" /> },
          { value: 'fitness', label: 'Fitness', icon: <Dumbbell className="h-4 w-4" /> },
          { value: 'nutrition', label: 'Nutrition', icon: <Apple className="h-4 w-4" /> },
          { value: 'privacy', label: 'Privacy', icon: <Shield className="h-4 w-4" /> },
        ]}
        tabsListClassName="mb-6"
      >
        <TabsContent value="personal">
          <PersonalInfoTab profile={profile ?? null} />
        </TabsContent>
        <TabsContent value="metrics">
          <BodyMetricsTab profile={profile ?? null} />
        </TabsContent>
        <TabsContent value="fitness">
          <FitnessTab profile={profile ?? null} />
        </TabsContent>
        <TabsContent value="nutrition">
          <NutritionTab profile={profile ?? null} />
        </TabsContent>
        <TabsContent value="privacy">
          <PrivacyTab profile={profile ?? null} />
        </TabsContent>
      </ResponsiveTabs>
    </PageLayout>
  );
};
