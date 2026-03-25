import { useState } from 'react';
import { Users } from 'lucide-react';
import {
  Badge,
  Card,
  CardContent,
  SkeletonHeader,
  SkeletonCardList,
} from '@/components/ui';
import { PageLayout } from '@/components/layouts';
import { useClients, useClientStats, useUpdateClientStatus } from '@/api/client-roster';
import { useDebounce } from '@/hooks';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { ClientCard, ClientFilters } from './components';
type ActiveClientStatus = 'ONBOARDING' | 'ACTIVE' | 'INACTIVE' | 'ON_HOLD';

export const ClientsPage = () => {
  const { hasAccess, requiredTier } = useFeatureAccess('clientManagement');
  const [status, setStatus] = useState<ActiveClientStatus | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [showDisconnected, setShowDisconnected] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useClients({
    status,
    includeDisconnected: showDisconnected,
    search: debouncedSearch,
  });
  const { data: stats } = useClientStats();
  const updateStatus = useUpdateClientStatus();

  const handleStatusChange = (id: string, newStatus: ActiveClientStatus) => {
    updateStatus.mutate({ id, status: newStatus });
  };

  const statsBadges = stats ? (
    <div className="flex items-center gap-2 text-sm flex-wrap">
      {stats.onboarding > 0 && (
        <Badge variant="info">{stats.onboarding} onboarding</Badge>
      )}
      <Badge variant="success">{stats.active} active</Badge>
      {stats.onHold > 0 && (
        <Badge variant="warning">{stats.onHold} on hold</Badge>
      )}
      {stats.inactive > 0 && (
        <Badge variant="secondary">{stats.inactive} inactive</Badge>
      )}
    </div>
  ) : null;

  if (!hasAccess) {
    return (
      <PageLayout>
        <PageLayout.Header
          title="Clients"
          description="Manage your connected clients"
          icon={<Users className="h-6 w-6 sm:h-8 sm:w-8" />}
        />
        <PageLayout.Content>
          <UpgradePrompt requiredTier={requiredTier} featureName="Client Management" />
        </PageLayout.Content>
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout>
        <PageLayout.Content>
          <SkeletonHeader />
          <SkeletonCardList count={5} />
        </PageLayout.Content>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageLayout.Header
        title="Clients"
        description="Manage your connected clients"
        icon={<Users className="h-6 w-6 sm:h-8 sm:w-8" />}
        action={statsBadges}
      />
      <PageLayout.Content>
        <ClientFilters
          status={status}
          onStatusChange={setStatus}
          search={search}
          onSearchChange={setSearch}
          showDisconnected={showDisconnected}
          onShowDisconnectedChange={setShowDisconnected}
        />

        {!data?.clients.length ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg mb-2">No clients yet</h3>
              <p className="text-muted-foreground">
                {status || search
                  ? 'No clients match your filters. Try adjusting your search.'
                  : 'When you accept connection requests, your clients will appear here.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {data.clients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </PageLayout.Content>
    </PageLayout>
  );
};

export default ClientsPage;
