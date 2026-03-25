

/////////////////////////////////////////
// MESSAGE SCHEMA
/////////////////////////////////////////

export const MessageSchema = z.object({
  id: z.string().cuid(),
  connectionId: z.string(),
  senderId: z.string(),
  content: z.string().min(1, { message: "Message cannot be empty" }).max(5000, { message: "Message must be at most 5000 characters" }),
  isRead: z.boolean(),
  readAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
})

export type Message = z.infer<typeof MessageSchema>

/////////////////////////////////////////
// MESSAGE OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const MessageOptionalDefaultsSchema = MessageSchema.merge(z.object({
  id: z.string().cuid().optional(),
  isRead: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
}))

export type MessageOptionalDefaults = z.infer<typeof MessageOptionalDefaultsSchema>

export default MessageSchema;
