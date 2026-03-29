import { Link2 } from 'lucide-react';
import { useIntegrations } from '@/api/integration';
import { IntegrationCard } from './IntegrationCard';
import { PROVIDERS } from './integrations.constants';
import { Skeleton } from '@/components/ui';

export const IntegrationsTab = () => {
  const { data: connections, isLoading } = useIntegrations();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
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
        {PROVIDERS.map((meta) => {
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
