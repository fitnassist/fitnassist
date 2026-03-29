import { prisma } from '../lib/prisma';
import type { IntegrationProvider, IntegrationStatus } from '@fitnassist/database';
import { encrypt, decrypt } from '../lib/encryption';

const decryptConnection = <T extends { accessToken: string; refreshToken: string | null }>(
  connection: T
): T => ({
  ...connection,
  accessToken: decrypt(connection.accessToken),
  refreshToken: connection.refreshToken ? decrypt(connection.refreshToken) : null,
});

export const integrationRepository = {
  async findByUserAndProvider(userId: string, provider: IntegrationProvider) {
    const connection = await prisma.integrationConnection.findUnique({
      where: { userId_provider: { userId, provider } },
    });
    return connection ? decryptConnection(connection) : null;
  },

  async findByProvider(provider: IntegrationProvider, status?: IntegrationStatus) {
    const connections = await prisma.integrationConnection.findMany({
      where: { provider, ...(status && { status }) },
    });
    return connections.map(decryptConnection);
  },

  async findByExternalUserId(provider: IntegrationProvider, externalUserId: string) {
    const connection = await prisma.integrationConnection.findFirst({
      where: { provider, externalUserId },
    });
    return connection ? decryptConnection(connection) : null;
  },

  async findAllByUser(userId: string) {
    const connections = await prisma.integrationConnection.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return connections.map(decryptConnection);
  },

  async findAllConnected(provider?: IntegrationProvider) {
    const connections = await prisma.integrationConnection.findMany({
      where: {
        status: 'CONNECTED',
        ...(provider && { provider }),
      },
    });
    return connections.map(decryptConnection);
  },

  async findTokensExpiringWithin(minutes: number) {
    const cutoff = new Date(Date.now() + minutes * 60 * 1000);
    const connections = await prisma.integrationConnection.findMany({
      where: {
        status: 'CONNECTED',
        tokenExpiresAt: { lte: cutoff },
      },
    });
    return connections.map(decryptConnection);
  },

  async upsert(
    userId: string,
    provider: IntegrationProvider,
    data: {
      accessToken: string;
      refreshToken?: string | null;
      tokenExpiresAt?: Date | null;
      scope?: string | null;
      externalUserId?: string | null;
    }
  ) {
    const encryptedData = {
      accessToken: encrypt(data.accessToken),
      refreshToken: data.refreshToken ? encrypt(data.refreshToken) : null,
      tokenExpiresAt: data.tokenExpiresAt ?? null,
      scope: data.scope ?? null,
      externalUserId: data.externalUserId ?? null,
    };

    const connection = await prisma.integrationConnection.upsert({
      where: { userId_provider: { userId, provider } },
      create: {
        userId,
        provider,
        status: 'CONNECTED',
        ...encryptedData,
      },
      update: {
        status: 'CONNECTED',
        lastSyncError: null,
        ...encryptedData,
      },
    });
    return decryptConnection(connection);
  },

  async updateTokens(
    userId: string,
    provider: IntegrationProvider,
    data: {
      accessToken: string;
      refreshToken?: string | null;
      tokenExpiresAt?: Date | null;
    }
  ) {
    const connection = await prisma.integrationConnection.update({
      where: { userId_provider: { userId, provider } },
      data: {
        accessToken: encrypt(data.accessToken),
        ...(data.refreshToken !== undefined && {
          refreshToken: data.refreshToken ? encrypt(data.refreshToken) : null,
        }),
        ...(data.tokenExpiresAt !== undefined && {
          tokenExpiresAt: data.tokenExpiresAt,
        }),
      },
    });
    return decryptConnection(connection);
  },

  async updateSyncStatus(
    userId: string,
    provider: IntegrationProvider,
    data: {
      status?: IntegrationStatus;
      lastSyncAt?: Date;
      lastSyncError?: string | null;
      initialImportComplete?: boolean;
    }
  ) {
    return prisma.integrationConnection.update({
      where: { userId_provider: { userId, provider } },
      data,
    });
  },

  async updateSyncPreferences(
    userId: string,
    provider: IntegrationProvider,
    preferences: Record<string, boolean>
  ) {
    return prisma.integrationConnection.update({
      where: { userId_provider: { userId, provider } },
      data: { syncPreferences: preferences },
    });
  },

  async updateWebhookSubscriptionId(
    userId: string,
    provider: IntegrationProvider,
    webhookSubscriptionId: string | null
  ) {
    return prisma.integrationConnection.update({
      where: { userId_provider: { userId, provider } },
      data: { webhookSubscriptionId },
    });
  },

  async disconnect(userId: string, provider: IntegrationProvider) {
    return prisma.integrationConnection.update({
      where: { userId_provider: { userId, provider } },
      data: {
        status: 'DISCONNECTED',
        accessToken: encrypt('revoked'),
        refreshToken: null,
        webhookSubscriptionId: null,
      },
    });
  },

  async delete(userId: string, provider: IntegrationProvider) {
    return prisma.integrationConnection.delete({
      where: { userId_provider: { userId, provider } },
    });
  },
};
