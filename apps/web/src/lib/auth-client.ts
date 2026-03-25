import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  plugins: [
    inferAdditionalFields({
      user: {
        role: {
          type: 'string',
          required: false,
          defaultValue: 'TRAINEE',
          input: true,
        },
      },
    }),
  ],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  requestPasswordReset,
  resetPassword,
  changeEmail,
  changePassword,
  deleteUser,
} = authClient;
