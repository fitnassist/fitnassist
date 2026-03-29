import { z } from 'zod';

export const IntegrationStatusSchema = z.enum(['CONNECTED','DISCONNECTED','ERROR','SYNCING']);

export type IntegrationStatusType = `${z.infer<typeof IntegrationStatusSchema>}`

export default IntegrationStatusSchema;
