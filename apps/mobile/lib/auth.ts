import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const apiUrl = Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:3001';

export const authClient = createAuthClient({
  baseURL: apiUrl,
  plugins: [
    expoClient({
      scheme: 'fitnassist',
      storagePrefix: 'fitnassist',
      storage: SecureStore,
    }),
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
} = authClient;
