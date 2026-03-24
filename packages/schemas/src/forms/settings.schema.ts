import { z } from 'zod';

// =============================================================================
// SETTINGS FORM SCHEMAS
// =============================================================================

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Change Email Form
export const changeEmailFormSchema = z.object({
  newEmail: z.string().email('Please enter a valid email address'),
  currentPassword: z.string().min(1, 'Current password is required'),
});

export type ChangeEmailFormInput = z.infer<typeof changeEmailFormSchema>;

// Change Password Form
export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordFormInput = z.infer<typeof changePasswordFormSchema>;

// Notification Preferences
export const notificationPreferencesSchema = z.object({
  // Email notifications
  emailNotifyConnectionRequests: z.boolean(),
  emailNotifyMessages: z.boolean(),
  emailNotifyMarketing: z.boolean(),
  emailNotifyWeeklyReport: z.boolean(),
  // SMS notifications
  smsNotifyConnectionRequests: z.boolean(),
  smsNotifyMessages: z.boolean(),
  // Push notifications
  pushNotifyConnectionRequests: z.boolean(),
  pushNotifyMessages: z.boolean(),
});

export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;

// Delete Account Confirmation
export const deleteAccountFormSchema = z.object({
  confirmText: z.string().refine((val) => val === 'DELETE', {
    message: 'Please type DELETE to confirm',
  }),
  password: z.string().min(1, 'Password is required'),
});

export type DeleteAccountFormInput = {
  confirmText: string;
  password: string;
};
