import { useMemo } from 'react';
import { Users, UserPlus, Heart } from 'lucide-react';
import { PageLayout } from '@/components/layouts';
import { ResponsiveTabs, TabsContent } from '@/components/ui';
import { useTabParam } from '@/hooks';
import { usePendingFriendCount } from '@/api/friendship';
import { FriendsList, FriendRequests, FollowingList } from './components';

export const FriendsPage = () => {
  const [tab, setTab] = useTabParam('friends');
  const { data: pendingCount } = usePendingFriendCount();

  const tabOptions = useMemo(() => [
    { value: 'friends', label: 'Friends', icon: <Users className="h-4 w-4" /> },
    { value: 'requests', label: 'Requests', icon: <UserPlus className="h-4 w-4" />, badge: pendingCount || undefined },
    { value: 'following', label: 'Following', icon: <Heart className="h-4 w-4" /> },
  ], [pendingCount]);

  return (
    <PageLayout>
      <PageLayout.Header
        title="Friends & Following"
        description="Manage your friends and trainers you follow."
      />
      <PageLayout.Content>
        <ResponsiveTabs value={tab} onValueChange={setTab} options={tabOptions}>
          <TabsContent value="friends">
            <FriendsList />
          </TabsContent>
          <TabsContent value="requests">
            <FriendRequests />
          </TabsContent>
          <TabsContent value="following">
            <FollowingList />
          </TabsContent>
        </ResponsiveTabs>
      </PageLayout.Content>
    </PageLayout>
  );
};

export default FriendsPage;
