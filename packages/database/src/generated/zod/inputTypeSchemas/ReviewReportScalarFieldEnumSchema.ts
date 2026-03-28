import { z } from 'zod';

export const ReviewReportScalarFieldEnumSchema = z.enum(['id','reviewId','reporterId','reason','details','createdAt']);

export default ReviewReportScalarFieldEnumSchema;
