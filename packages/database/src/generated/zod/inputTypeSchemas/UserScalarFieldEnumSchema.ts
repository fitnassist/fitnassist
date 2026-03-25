import { z } from 'zod';

export const UserScalarFieldEnumSchema = z.enum(['id','name','email','emailVerified','image','role','lastActiveAt','createdAt','updatedAt','emailNotifyConnectionRequests','emailNotifyMessages','emailNotifyMarketing','emailNotifyWeeklyReport','emailNotifyBookings','emailNotifyBookingReminders','smsNotifyConnectionRequests','smsNotifyMessages','pushNotifyConnectionRequests','pushNotifyMessages','pushNotifyBookings','pushNotifyBookingReminders','pushNotifyPlanAssignments','pushNotifyOnboarding','pushNotifyDiary','pushNotifyGoals']);

export default UserScalarFieldEnumSchema;
