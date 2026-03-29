import { z } from 'zod';

export const WebsiteStatusSchema = z.enum(['DRAFT','PUBLISHED','MAINTENANCE']);

export type WebsiteStatusType = `${z.infer<typeof WebsiteStatusSchema>}`

export default WebsiteStatusSchema;
