import { z } from 'zod';


export const BillingPeriodSchema = z.enum(['MONTHLY','ANNUAL']);

export type BillingPeriodType = `${z.infer<typeof BillingPeriodSchema>}`

export default BillingPeriodSchema;
