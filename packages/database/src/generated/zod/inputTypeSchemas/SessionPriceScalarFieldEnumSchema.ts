import { z } from 'zod';

export const SessionPriceScalarFieldEnumSchema = z.enum(['id','trainerId','amount','currency','createdAt','updatedAt']);

export default SessionPriceScalarFieldEnumSchema;
