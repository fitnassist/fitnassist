import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, TRPCClientError } from '@trpc/client';
import { observable } from '@trpc/server/observable';
import superjson from 'superjson';
import type { TRPCLink } from '@trpc/client';
import type { AppRouter } from '@fitnassist/api/src/routers';

export const trpc = createTRPCReact<AppRouter>();

const unauthorizedLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      const unsubscribe = next(op).subscribe({
        next: (value) => observer.next(value),
        error: (err) => {
          if (
            err instanceof TRPCClientError &&
            err.data?.code === 'UNAUTHORIZED'
          ) {
            // Clear query cache and redirect to login
            window.location.href = '/login';
          }
          observer.error(err);
        },
        complete: () => observer.complete(),
      });
      return unsubscribe;
    });
  };
};

export function createTRPCClient() {
  return trpc.createClient({
    links: [
      unauthorizedLink,
      httpBatchLink({
        url: `${import.meta.env.VITE_API_URL || ''}/trpc`,
        transformer: superjson,
        fetch(url, options) {
          return fetch(url, { ...options, credentials: 'include' });
        },
      }),
    ],
  });
}
