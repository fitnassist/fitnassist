import { z } from 'zod';

export const ReportReasonSchema = z.enum(['INAPPROPRIATE','FAKE','SPAM','HARASSMENT']);

export type ReportReasonType = `${z.infer<typeof ReportReasonSchema>}`

export default ReportReasonSchema;
