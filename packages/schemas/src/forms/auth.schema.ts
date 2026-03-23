import { z } from 'zod';

// =============================================================================
// AUTH FORM SCHEMAS
// =============================================================================
// These schemas are for auth forms which have fields not stored directly
// in the database (like password, confirmPassword)

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const loginFormSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormInput = z.infer<typeof loginFormSchema>;

export const registerFormSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: passwordSchema,
    confirmPassword: z.string(),
    role: z.enum(['TRAINEE', 'TRAINER']).default('TRAINEE'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormInput = z.infer<typeof registerFormSchema>;

export const forgotPasswordFormSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export type ForgotPasswordFormInput = z.infer<typeof forgotPasswordFormSchema>;

export const resetPasswordFormSchema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormInput = z.infer<typeof resetPasswordFormSchema>;
