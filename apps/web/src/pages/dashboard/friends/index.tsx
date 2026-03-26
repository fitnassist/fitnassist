import { useState } from 'react';
import { Users, UserPlus, Heart } from 'lucide-react';
import { Button } from '@/components/ui';
import { PageLayout } from '@/components/layouts';
import { FriendsList, FriendRequests, FollowingList } from './components';

const TABS = [
  { key: 'friends', label: 'Friends', icon: Users },
  { key: 'requests', label: 'Requests', icon: UserPlus },
  { key: 'following', label: 'Following', icon: Heart },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export const FriendsPage = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('friends');

  return (
    <PageLayout>
      <PageLayout.Header
        title="Friends & Following"
        description="Manage your friends and trainers you follow."
      />
      <PageLayout.Content>
        {/* Tab navigation */}
        <div className="flex gap-2 border-b pb-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab.key)}
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === 'friends' && <FriendsList />}
        {activeTab === 'requests' && <FriendRequests />}
        {activeTab === 'following' && <FollowingList />}
      </PageLayout.Content>
    </PageLayout>
  );
};

export default FriendsPage;
