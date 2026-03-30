import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import type { AppRouter } from '@fitnassist/api/src/routers';

export const trpc = createTRPCReact<AppRouter>();

const apiUrl = Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:3001';

const getAuthHeaders = async () => {
  const cookieData = await SecureStore.getItemAsync('fitnassist_cookie');
  if (cookieData) {
    return { Cookie: cookieData };
  }
  return {};
};

export const createTRPCClient = () => {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${apiUrl}/trpc`,
        transformer: superjson,
        async headers() {
          return await getAuthHeaders();
        },
      }),
    ],
  });
};
