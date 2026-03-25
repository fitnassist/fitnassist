import { ContactRequestTypeSchema } from '../inputTypeSchemas/ContactRequestTypeSchema'
import { ContactRequestStatusSchema } from '../inputTypeSchemas/ContactRequestStatusSchema'

/////////////////////////////////////////
// CONTACT REQUEST SCHEMA
/////////////////////////////////////////

export const ContactRequestSchema = z.object({
  type: ContactRequestTypeSchema,
  status: ContactRequestStatusSchema,
  id: z.string().cuid(),
  trainerId: z.string(),
  senderId: z.string().nullable(),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).max(100),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(10, { message: "Please enter a valid phone number" }).max(20).nullable(),
  message: z.string().max(2000, { message: "Message must be at most 2000 characters" }).nullable(),
  respondedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type ContactRequest = z.infer<typeof ContactRequestSchema>

/////////////////////////////////////////
// CONTACT REQUEST OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const ContactRequestOptionalDefaultsSchema = ContactRequestSchema.merge(z.object({
  status: ContactRequestStatusSchema.optional(),
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type ContactRequestOptionalDefaults = z.infer<typeof ContactRequestOptionalDefaultsSchema>

export default ContactRequestSchema;
