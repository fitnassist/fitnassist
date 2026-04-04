import { z } from 'zod';

export const UserScalarFieldEnumSchema = z.enum(['id','name','email','emailVerified','image','role','phoneNumber','lastActiveAt','createdAt','updatedAt','emailNotifyConnectionRequests','emailNotifyMessages','emailNotifyMarketing','emailNotifyWeeklyReport','emailNotifyBookings','emailNotifyBookingReminders','smsNotifyConnectionRequests','smsNotifyMessages','smsNotifyBookings','smsNotifyBookingReminders','pushNotifyConnectionRequests','pushNotifyMessages','pushNotifyBookings','pushNotifyBookingReminders','pushNotifyPlanAssignments','pushNotifyOnboarding','pushNotifyDiary','pushNotifyGoals','webTourCompleted','webTourSkippedAt','mobileTourCompleted','mobileTourSkippedAt']);

export default UserScalarFieldEnumSchema;
