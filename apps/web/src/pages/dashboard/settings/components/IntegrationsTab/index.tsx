import { Link2 } from 'lucide-react';
import { useIntegrations, useAvailableProviders } from '@/api/integration';
import { IntegrationCard } from './IntegrationCard';
import { PROVIDERS } from './integrations.constants';
import { Skeleton } from '@/components/ui';

export const IntegrationsTab = () => {
  const { data: connections, isLoading: connectionsLoading } = useIntegrations();
  const { data: availableProviders, isLoading: providersLoading } = useAvailableProviders();

  const isLoading = connectionsLoading || providersLoading;

  const visibleProviders = PROVIDERS.filter((meta) => availableProviders?.includes(meta.provider));

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (visibleProviders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Link2 className="h-8 w-8 mx-auto mb-3 opacity-50" />
        <p>No integrations available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link2 className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Connected Apps</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Connect your fitness apps to automatically sync activities, steps, sleep and more.
        </p>
      </div>

      <div className="grid gap-4">
        {visibleProviders.map((meta) => {
          const connection = connections?.find((c) => c.provider === meta.provider);
          return (
            <IntegrationCard
              key={meta.provider}
              meta={meta}
              connection={connection as Parameters<typeof IntegrationCard>[0]['connection']}
            />
          );
        })}
      </div>
    </div>
  );
};
