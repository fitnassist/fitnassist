import { z } from 'zod';

export const ReviewScalarFieldEnumSchema = z.enum(['id','trainerId','reviewerId','rating','text','replyText','repliedAt','createdAt','updatedAt']);

export default ReviewScalarFieldEnumSchema;
