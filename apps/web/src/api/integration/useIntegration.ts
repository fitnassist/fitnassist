import { trpc } from '@/lib/trpc';
import type { IntegrationProvider } from '@fitnassist/database';

export const useAvailableProviders = () => {
  return trpc.integration.availableProviders.useQuery();
};

export const useIntegrations = () => {
  return trpc.integration.list.useQuery();
};

export const useIntegrationStatus = (provider: IntegrationProvider) => {
  return trpc.integration.status.useQuery(
    { provider },
    { enabled: !!provider }
  );
};

export const useDisconnectIntegration = () => {
  const utils = trpc.useUtils();
  return trpc.integration.disconnect.useMutation({
    onSuccess: () => {
      utils.integration.list.invalidate();
    },
  });
};

export const useUpdateSyncPreferences = () => {
  const utils = trpc.useUtils();
  return trpc.integration.updatePreferences.useMutation({
    onSuccess: () => {
      utils.integration.list.invalidate();
    },
  });
};
