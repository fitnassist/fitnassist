import { z } from 'zod';

export const ContactRequestScalarFieldEnumSchema = z.enum(['id','trainerId','senderId','type','name','email','phone','message','status','respondedAt','createdAt','updatedAt']);

export default ContactRequestScalarFieldEnumSchema;
