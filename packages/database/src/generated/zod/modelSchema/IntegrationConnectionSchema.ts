import { z } from 'zod';
import { JsonValueSchema } from '../inputTypeSchemas/JsonValueSchema'
import { IntegrationProviderSchema } from '../inputTypeSchemas/IntegrationProviderSchema'
import { IntegrationStatusSchema } from '../inputTypeSchemas/IntegrationStatusSchema'

/////////////////////////////////////////
// INTEGRATION CONNECTION SCHEMA
/////////////////////////////////////////

export const IntegrationConnectionSchema = z.object({
  provider: IntegrationProviderSchema,
  status: IntegrationStatusSchema,
  id: z.string().cuid(),
  userId: z.string(),
  accessToken: z.string(),
  refreshToken: z.string().nullable(),
  tokenExpiresAt: z.coerce.date().nullable(),
  scope: z.string().nullable(),
  externalUserId: z.string().nullable(),
  webhookSubscriptionId: z.string().nullable(),
  lastSyncAt: z.coerce.date().nullable(),
  lastSyncError: z.string().nullable(),
  syncPreferences: JsonValueSchema.nullable(),
  initialImportComplete: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type IntegrationConnection = z.infer<typeof IntegrationConnectionSchema>

/////////////////////////////////////////
// INTEGRATION CONNECTION OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const IntegrationConnectionOptionalDefaultsSchema = IntegrationConnectionSchema.merge(z.object({
  status: IntegrationStatusSchema.optional(),
  id: z.string().cuid().optional(),
  initialImportComplete: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type IntegrationConnectionOptionalDefaults = z.infer<typeof IntegrationConnectionOptionalDefaultsSchema>

export default IntegrationConnectionSchema;
