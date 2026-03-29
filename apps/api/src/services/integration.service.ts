import { TRPCError } from '@trpc/server';
import { integrationRepository } from '../repositories/integration.repository';
import type { IntegrationProvider } from '@fitnassist/database';

const DEFAULT_SYNC_PREFERENCES = {
  activities: true,
  steps: true,
  sleep: true,
  weight: true,
  water: true,
};

export const integrationService = {
  async getConnections(userId: string) {
    const connections = await integrationRepository.findAllByUser(userId);
    // Strip tokens from response — never expose to client
    return connections.map(({ accessToken: _, refreshToken: __, ...rest }) => rest);
  },

  async getConnectionStatus(userId: string, provider: IntegrationProvider) {
    const connection = await integrationRepository.findByUserAndProvider(userId, provider);
    if (!connection) return null;
    const { accessToken: _, refreshToken: __, ...rest } = connection;
    return rest;
  },

  async disconnect(userId: string, provider: IntegrationProvider) {
    const connection = await integrationRepository.findByUserAndProvider(userId, provider);
    if (!connection) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Integration not connected' });
    }

    await integrationRepository.disconnect(userId, provider);
    return { success: true };
  },

  async updateSyncPreferences(
    userId: string,
    provider: IntegrationProvider,
    preferences: Record<string, boolean>
  ) {
    const connection = await integrationRepository.findByUserAndProvider(userId, provider);
    if (!connection) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Integration not connected' });
    }

    // Merge with defaults to ensure all keys exist
    const merged = { ...DEFAULT_SYNC_PREFERENCES, ...preferences };
    await integrationRepository.updateSyncPreferences(userId, provider, merged);
    return { success: true };
  },

  /**
   * Wraps an API call with automatic token refresh on 401.
   * The refreshFn should call the provider's refresh endpoint and update stored tokens.
   */
  async withTokenRefresh<T>(
    userId: string,
    provider: IntegrationProvider,
    apiCall: (accessToken: string) => Promise<T>,
    refreshFn: (refreshToken: string) => Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }>
  ): Promise<T> {
    const connection = await integrationRepository.findByUserAndProvider(userId, provider);
    if (!connection) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Integration not connected' });
    }

    try {
      return await apiCall(connection.accessToken);
    } catch (error: unknown) {
      const status = (error as { status?: number })?.status ??
        (error as { response?: { status?: number } })?.response?.status;

      if (status === 401 && connection.refreshToken) {
        try {
          const newTokens = await refreshFn(connection.refreshToken);
          await integrationRepository.updateTokens(userId, provider, {
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken ?? connection.refreshToken,
            tokenExpiresAt: newTokens.expiresAt ?? null,
          });
          return await apiCall(newTokens.accessToken);
        } catch (refreshError) {
          console.error(`[Integration] Token refresh failed for ${provider}/${userId}:`, refreshError);
          await integrationRepository.updateSyncStatus(userId, provider, {
            status: 'ERROR',
            lastSyncError: 'Token refresh failed — please reconnect',
          });
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Integration token expired. Please reconnect.',
          });
        }
      }

      throw error;
    }
  },
};
