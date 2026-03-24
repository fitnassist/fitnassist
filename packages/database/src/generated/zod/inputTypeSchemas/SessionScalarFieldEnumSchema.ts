import { z } from 'zod';


export const SessionScalarFieldEnumSchema = z.enum(['id','userId','token','expiresAt','createdAt','updatedAt','ipAddress','userAgent']);

export default SessionScalarFieldEnumSchema;
