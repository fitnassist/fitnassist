import { z } from 'zod';

export const ExpoPushTokenScalarFieldEnumSchema = z.enum(['id','userId','token','platform','createdAt','updatedAt']);

export default ExpoPushTokenScalarFieldEnumSchema;
