import { trpc } from '@/lib/trpc';

export function useNewsletterSubscribe() {
  return trpc.newsletter.subscribe.useMutation();
}
