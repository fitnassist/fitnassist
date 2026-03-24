import { trpc } from '@/lib/trpc';

export const useCreateCheckoutSession = () => {
  return trpc.subscription.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      console.error('[Checkout] Failed to create session:', error.message);
    },
  });
};

export const useCreatePortalSession = () => {
  return trpc.subscription.createPortalSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
};
