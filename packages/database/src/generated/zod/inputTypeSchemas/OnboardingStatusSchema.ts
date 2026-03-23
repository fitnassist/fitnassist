import { z } from 'zod';

export const OnboardingStatusSchema = z.enum(['PENDING','SUBMITTED','APPROVED','REJECTED']);

export type OnboardingStatusType = `${z.infer<typeof OnboardingStatusSchema>}`

export default OnboardingStatusSchema;
