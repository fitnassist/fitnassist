

export const ContactRequestStatusSchema = z.enum(['PENDING','ACCEPTED','DECLINED','RESPONDED','CLOSED']);

export type ContactRequestStatusType = `${z.infer<typeof ContactRequestStatusSchema>}`

export default ContactRequestStatusSchema;
