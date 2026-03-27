import { z } from 'zod';

export const CancellationPolicyScalarFieldEnumSchema = z.enum(['id','trainerId','fullRefundHours','partialRefundHours','partialRefundPercent','createdAt','updatedAt']);

export default CancellationPolicyScalarFieldEnumSchema;
