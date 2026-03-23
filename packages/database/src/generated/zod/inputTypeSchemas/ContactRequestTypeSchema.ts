import { z } from 'zod';

export const ContactRequestTypeSchema = z.enum(['CALLBACK_REQUEST','CONNECTION_REQUEST']);

export type ContactRequestTypeType = `${z.infer<typeof ContactRequestTypeSchema>}`

export default ContactRequestTypeSchema;
