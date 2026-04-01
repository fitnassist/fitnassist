import { Link } from 'react-router-dom';
import { User, MapPin, Briefcase, Image, Settings } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  ResponsiveTabs,
  TabsContent,
} from '@/components/ui';
import { PageLayout } from '@/components/layouts';
import { useTabParam } from '@/hooks';
import { routes } from '@/config/routes';
import { trpc } from '@/lib/trpc';
import { BasicInfoTab, LocationTab, ServicesTab, ImagesTab, SettingsTab } from './components';

export const ProfileEditPage = () => {
  const [activeTab, setActiveTab] = useTabParam('basic');
  const { data: profile, isLoading } = trpc.trainer.getMyProfile.useQuery();

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

  if (!profile) {
    return (
      <PageLayout maxWidth="3xl">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>No Profile Found</CardTitle>
            <CardDescription>You haven't created a trainer profile yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to={routes.trainerProfileCreate}>
              <Button className="w-full">Create Profile</Button>
            </Link>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout maxWidth="3xl">
      <PageLayout.Header
        title="Edit Profile"
        description="Update your trainer profile information"
        backLink={{ to: routes.dashboard, label: 'Back to Dashboard' }}
        action={
          <Link to={routes.trainerPublicProfile(profile.handle)}>
            <Button variant="outline">View Public Profile</Button>
          </Link>
        }
      />
      <ResponsiveTabs
        value={activeTab}
        onValueChange={setActiveTab}
        options={[
          { value: 'basic', label: 'Basic', icon: <User className="h-4 w-4" /> },
          { value: 'location', label: 'Location', icon: <MapPin className="h-4 w-4" /> },
          { value: 'services', label: 'Services', icon: <Briefcase className="h-4 w-4" /> },
          { value: 'images', label: 'Media', icon: <Image className="h-4 w-4" /> },
          { value: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
        ]}
        tabsListClassName="mb-6"
      >
        <TabsContent value="basic">
          <BasicInfoTab profile={profile} />
        </TabsContent>
        <TabsContent value="location">
          <LocationTab profile={profile} />
        </TabsContent>
        <TabsContent value="services">
          <ServicesTab profile={profile} />
        </TabsContent>
        <TabsContent value="images">
          <ImagesTab profile={profile} />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsTab profile={profile} />
        </TabsContent>
      </ResponsiveTabs>
    </PageLayout>
  );
};

export default ProfileEditPage;
