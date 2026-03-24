import { z } from 'zod';
import { JsonValueSchema } from '../inputTypeSchemas/JsonValueSchema'
import { NotificationTypeSchema } from '../inputTypeSchemas/NotificationTypeSchema'

/////////////////////////////////////////
// NOTIFICATION SCHEMA
/////////////////////////////////////////

export const NotificationSchema = z.object({
  type: NotificationTypeSchema,
  id: z.string().cuid(),
  userId: z.string(),
  title: z.string().max(200),
  body: z.string().max(500).nullable(),
  data: JsonValueSchema.nullable(),
  link: z.string().nullable(),
  isRead: z.boolean(),
  readAt: z.coerce.date().nullable(),
  isDismissed: z.boolean(),
  createdAt: z.coerce.date(),
})

export type Notification = z.infer<typeof NotificationSchema>

/////////////////////////////////////////
// NOTIFICATION OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const NotificationOptionalDefaultsSchema = NotificationSchema.merge(z.object({
  id: z.string().cuid().optional(),
  isRead: z.boolean().optional(),
  isDismissed: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
}))

export type NotificationOptionalDefaults = z.infer<typeof NotificationOptionalDefaultsSchema>

export default NotificationSchema;
