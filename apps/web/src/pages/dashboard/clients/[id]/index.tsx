import { useParams } from 'react-router-dom';
import { Users, User, FileText, ClipboardList, ClipboardCheck, TrendingUp } from 'lucide-react';
import { ResponsiveTabs, TabsContent } from '@/components/ui';
import { PageLayout } from '@/components/layouts';
import { useTabParam } from '@/hooks';
import { useClient, useUpdateClientStatus, useDisconnectClient } from '@/api/client-roster';
import { routes } from '@/config/routes';
import { ClientOverview, ClientNotes, ClientPlans, ClientOnboarding, ClientProgress } from './components';
type ActiveClientStatus = 'ONBOARDING' | 'ACTIVE' | 'INACTIVE' | 'ON_HOLD';

export const ClientDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useTabParam('overview');

  const { data: client, isLoading } = useClient(id || '');
  const updateStatus = useUpdateClientStatus();
  const disconnectClient = useDisconnectClient();

  const handleStatusChange = (status: ActiveClientStatus) => {
    if (id) updateStatus.mutate({ id, status });
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-4 w-64 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </PageLayout>
    );
  }

  if (!client) {
    return (
      <PageLayout>
        <PageLayout.Header
          title="Client Not Found"
          backLink={{ to: routes.dashboardClients, label: 'Back to Clients' }}
        />
        <p className="text-muted-foreground">This client could not be found.</p>
      </PageLayout>
    );
  }

  const displayName = client.connection.sender?.name || client.connection.name;
  const hasOnboarding = (client.onboardingResponses?.length ?? 0) > 0;
  const isDisconnected = client.status === 'DISCONNECTED';
  const traineeUserId = client.connection.sender?.id;

  const tabOptions = [
    { value: 'overview', label: 'Overview', icon: <User className="h-4 w-4" /> },
    ...(hasOnboarding
      ? [{ value: 'onboarding', label: 'Onboarding', icon: <ClipboardCheck className="h-4 w-4" /> }]
      : []),
    { value: 'plans', label: 'Plans', icon: <ClipboardList className="h-4 w-4" /> },
    ...(traineeUserId
      ? [{ value: 'progress', label: 'Progress', icon: <TrendingUp className="h-4 w-4" /> }]
      : []),
    { value: 'notes', label: 'Notes', icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <PageLayout>
      <PageLayout.Header
        title={displayName}
        icon={<Users className="h-6 w-6 sm:h-8 sm:w-8" />}
        backLink={{ to: routes.dashboardClients, label: 'Back to Clients' }}
      />
      <ResponsiveTabs
        value={activeTab}
        onValueChange={setActiveTab}
        options={tabOptions}
        tabsListClassName="mb-6"
      >
        <TabsContent value="overview">
          <ClientOverview
            client={client}
            onStatusChange={handleStatusChange}
            isUpdating={updateStatus.isPending}
            onDisconnect={isDisconnected ? undefined : () => { if (id) disconnectClient.mutate({ id }); }}
            isDisconnecting={disconnectClient.isPending}
          />
        </TabsContent>
        {hasOnboarding && (
          <TabsContent value="onboarding">
            <ClientOnboarding clientRosterId={client.id} />
          </TabsContent>
        )}
        <TabsContent value="plans">
          <ClientPlans
            clientId={client.id}
            workoutPlanAssignments={client.workoutPlanAssignments ?? []}
            mealPlanAssignments={client.mealPlanAssignments ?? []}
            isDisconnected={isDisconnected}
          />
        </TabsContent>
        {traineeUserId && (
          <TabsContent value="progress">
            <ClientProgress
              clientRosterId={client.id}
              traineeUserId={traineeUserId}
            />
          </TabsContent>
        )}
        <TabsContent value="notes">
          <ClientNotes clientRosterId={client.id} />
        </TabsContent>
      </ResponsiveTabs>
    </PageLayout>
  );
};

export default ClientDetailPage;
