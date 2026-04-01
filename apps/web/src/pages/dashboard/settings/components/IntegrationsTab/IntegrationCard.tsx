import { useState } from 'react';
import {
  ExternalLink,
  RefreshCw,
  Unlink,
  Activity,
  Footprints,
  Moon,
  Scale,
  Droplets,
} from 'lucide-react';
import { Button, Badge, Switch, Card, ConfirmDialog } from '@/components/ui';
import { useDisconnectIntegration, useUpdateSyncPreferences } from '@/api/integration';
import type { ProviderMeta } from './integrations.constants';
import { SYNC_PREFERENCE_LABELS } from './integrations.constants';
import { env } from '@/config/env';

interface ConnectionData {
  id: string;
  provider: string;
  status: string;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  syncPreferences: Record<string, boolean> | null;
  initialImportComplete: boolean;
}

interface IntegrationCardProps {
  meta: ProviderMeta;
  connection?: ConnectionData;
}

const SYNC_ICONS: Record<string, typeof Activity> = {
  activities: Activity,
  steps: Footprints,
  sleep: Moon,
  weight: Scale,
  water: Droplets,
};

const STATUS_BADGE: Record<
  string,
  { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }
> = {
  CONNECTED: { variant: 'default', label: 'Connected' },
  SYNCING: { variant: 'secondary', label: 'Syncing...' },
  ERROR: { variant: 'destructive', label: 'Error' },
  DISCONNECTED: { variant: 'outline', label: 'Disconnected' },
};

const formatLastSync = (date: string | null): string => {
  if (!date) return 'Never';
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString();
};

export const IntegrationCard = ({ meta, connection }: IntegrationCardProps) => {
  const [showDisconnect, setShowDisconnect] = useState(false);
  const disconnectMutation = useDisconnectIntegration();
  const updatePrefsMutation = useUpdateSyncPreferences();

  const isConnected = connection && connection.status !== 'DISCONNECTED';
  const statusInfo = (STATUS_BADGE[connection?.status ?? ''] ?? STATUS_BADGE.DISCONNECTED) as {
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    label: string;
  };
  const prefs = (connection?.syncPreferences ?? {
    activities: true,
    steps: true,
    sleep: true,
    weight: true,
    water: true,
  }) as Record<string, boolean>;

  const handleConnect = () => {
    const apiUrl = env.API_URL || '';
    window.location.href = `${apiUrl}${meta.authPath}`;
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate(
      { provider: meta.provider },
      { onSettled: () => setShowDisconnect(false) },
    );
  };

  const handleTogglePref = (key: string, value: boolean) => {
    updatePrefsMutation.mutate({
      provider: meta.provider,
      preferences: { ...prefs, [key]: value },
    });
  };

  return (
    <>
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${meta.bgColor} text-white font-bold text-sm`}
            >
              {meta.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{meta.name}</h3>
                {isConnected && <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{meta.description}</p>
              {isConnected && connection.lastSyncAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last synced: {formatLastSync(connection.lastSyncAt)}
                </p>
              )}
              {isConnected && connection.lastSyncError && (
                <p className="text-xs text-destructive mt-1">{connection.lastSyncError}</p>
              )}
              {isConnected && !connection.initialImportComplete && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Importing history...
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0">
            {isConnected ? (
              <Button variant="outline" size="sm" onClick={() => setShowDisconnect(true)}>
                <Unlink className="h-4 w-4 mr-1.5" />
                Disconnect
              </Button>
            ) : (
              <Button size="sm" onClick={handleConnect}>
                <ExternalLink className="h-4 w-4 mr-1.5" />
                Connect
              </Button>
            )}
          </div>
        </div>

        {isConnected && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium mb-3">Sync preferences</p>
            <div className="space-y-2.5">
              {Object.entries(SYNC_PREFERENCE_LABELS).map(([key, label]) => {
                const Icon = SYNC_ICONS[key] ?? Activity;
                return (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{label}</span>
                    </div>
                    <Switch
                      checked={prefs[key] ?? true}
                      onCheckedChange={(checked) => handleTogglePref(key, checked)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!isConnected && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {meta.dataTypes.map((type) => (
              <Badge key={type} variant="secondary" className="text-xs">
                {type}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={showDisconnect}
        onOpenChange={setShowDisconnect}
        title={`Disconnect ${meta.name}?`}
        description={`This will stop syncing data from ${meta.name}. Your existing diary entries will not be deleted.`}
        onConfirm={handleDisconnect}
        confirmLabel="Disconnect"
        variant="destructive"
        isLoading={disconnectMutation.isPending}
      />
    </>
  );
};
