import { trpc } from '@/lib/trpc';

export function useRequestCallback() {
  return trpc.contact.submitCallbackRequest.useMutation();
}
