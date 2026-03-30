import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { expo } from '@better-auth/expo';
import { prisma } from './prisma';
import { sendEmail } from './email';
import { env } from '../config/env';

const isProduction = env.NODE_ENV === 'production';

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  basePath: '/api/auth',
  secret: env.BETTER_AUTH_SECRET,

  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  advanced: {
    crossSubDomainCookies: isProduction ? {
      enabled: true,
    } : undefined,
    defaultCookieAttributes: isProduction ? {
      sameSite: 'none',
      secure: true,
    } : undefined,
  },

  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'TRAINEE',
        input: true,
      },
    },
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ user, newEmail, url }) => {
        void sendEmail({
          to: newEmail,
          subject: 'Verify your new email - Fitnassist',
          html: `
            <h2>Email Change Request</h2>
            <p>Hi ${user.name || 'there'},</p>
            <p>You requested to change your email address. Click the link below to verify your new email:</p>
            <p><a href="${url}">Verify New Email</a></p>
            <p>Or copy this link: ${url}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
          `,
        });
      },
    },
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url }) => {
        void sendEmail({
          to: user.email,
          subject: 'Confirm account deletion - Fitnassist',
          html: `
            <h2>Account Deletion Request</h2>
            <p>Hi ${user.name || 'there'},</p>
            <p>You requested to delete your Fitnassist account. This action is permanent and cannot be undone.</p>
            <p>Click the link below to confirm deletion:</p>
            <p><a href="${url}">Delete My Account</a></p>
            <p>Or copy this link: ${url}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't request this, you can safely ignore this email and your account will remain active.</p>
          `,
        });
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: 'Reset your password - Fitnassist',
        html: `
          <h2>Password Reset Request</h2>
          <p>Hi ${user.name || 'there'},</p>
          <p>You requested to reset your password. Click the link below to set a new password:</p>
          <p><a href="${url}">Reset Password</a></p>
          <p>Or copy this link: ${url}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        `,
      });
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: 'Verify your email - Fitnassist',
        html: `
          <h2>Welcome to Fitnassist!</h2>
          <p>Click the link below to verify your email address:</p>
          <p><a href="${url}">Verify Email</a></p>
          <p>Or copy this link: ${url}</p>
          <p>This link will expire in 24 hours.</p>
        `,
      });
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },

  plugins: [
    expo(),
  ],

  trustedOrigins: [env.FRONTEND_URL],
});

export type Auth = typeof auth;
