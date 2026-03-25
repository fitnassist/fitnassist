import { z } from 'zod';

export const ClientRosterScalarFieldEnumSchema = z.enum(['id','trainerId','connectionId','status','createdAt','updatedAt']);

export default ClientRosterScalarFieldEnumSchema;
