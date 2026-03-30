import { z } from 'zod';

export const ReferralStatusSchema = z.enum(['PENDING','ACTIVATED','EXPIRED']);

export type ReferralStatusType = `${z.infer<typeof ReferralStatusSchema>}`

export default ReferralStatusSchema;
