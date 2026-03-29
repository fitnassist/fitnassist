import { z } from 'zod';

export const IntegrationConnectionScalarFieldEnumSchema = z.enum(['id','userId','provider','status','accessToken','refreshToken','tokenExpiresAt','scope','externalUserId','webhookSubscriptionId','lastSyncAt','lastSyncError','syncPreferences','initialImportComplete','createdAt','updatedAt']);

export default IntegrationConnectionScalarFieldEnumSchema;
