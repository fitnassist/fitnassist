import { z } from 'zod';

export const ClientStatusSchema = z.enum(['ONBOARDING','ACTIVE','INACTIVE','ON_HOLD','DISCONNECTED']);

export type ClientStatusType = `${z.infer<typeof ClientStatusSchema>}`

export default ClientStatusSchema;
