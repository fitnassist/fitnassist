import { UserRoleSchema } from '../inputTypeSchemas/UserRoleSchema'

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

export const UserSchema = z.object({
  role: UserRoleSchema,
  id: z.string().cuid(),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  lastActiveAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  emailNotifyConnectionRequests: z.boolean(),
  emailNotifyMessages: z.boolean(),
  emailNotifyMarketing: z.boolean(),
  emailNotifyWeeklyReport: z.boolean(),
  emailNotifyBookings: z.boolean(),
  emailNotifyBookingReminders: z.boolean(),
  smsNotifyConnectionRequests: z.boolean(),
  smsNotifyMessages: z.boolean(),
  pushNotifyConnectionRequests: z.boolean(),
  pushNotifyMessages: z.boolean(),
  pushNotifyBookings: z.boolean(),
  pushNotifyBookingReminders: z.boolean(),
  pushNotifyPlanAssignments: z.boolean(),
  pushNotifyOnboarding: z.boolean(),
  pushNotifyDiary: z.boolean(),
  pushNotifyGoals: z.boolean(),
})

export type User = z.infer<typeof UserSchema>

/////////////////////////////////////////
// USER OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const UserOptionalDefaultsSchema = UserSchema.merge(z.object({
  role: UserRoleSchema.optional(),
  id: z.string().cuid().optional(),
  emailVerified: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  emailNotifyConnectionRequests: z.boolean().optional(),
  emailNotifyMessages: z.boolean().optional(),
  emailNotifyMarketing: z.boolean().optional(),
  emailNotifyWeeklyReport: z.boolean().optional(),
  emailNotifyBookings: z.boolean().optional(),
  emailNotifyBookingReminders: z.boolean().optional(),
  smsNotifyConnectionRequests: z.boolean().optional(),
  smsNotifyMessages: z.boolean().optional(),
  pushNotifyConnectionRequests: z.boolean().optional(),
  pushNotifyMessages: z.boolean().optional(),
  pushNotifyBookings: z.boolean().optional(),
  pushNotifyBookingReminders: z.boolean().optional(),
  pushNotifyPlanAssignments: z.boolean().optional(),
  pushNotifyOnboarding: z.boolean().optional(),
  pushNotifyDiary: z.boolean().optional(),
  pushNotifyGoals: z.boolean().optional(),
}))

export type UserOptionalDefaults = z.infer<typeof UserOptionalDefaultsSchema>

export default UserSchema;
