import { trpc } from '@/lib/trpc';

export const usePaymentSettings = () => {
  return trpc.payment.getSettings.useQuery();
};

export const useUpdateSessionPrice = () => {
  const utils = trpc.useUtils();
  return trpc.payment.updateSessionPrice.useMutation({
    onSuccess: () => {
      utils.payment.getSettings.invalidate();
    },
  });
};

export const useUpdateCancellationPolicy = () => {
  const utils = trpc.useUtils();
  return trpc.payment.updateCancellationPolicy.useMutation({
    onSuccess: () => {
      utils.payment.getSettings.invalidate();
    },
  });
};

export const useUpdatePaymentSettings = () => {
  const utils = trpc.useUtils();
  return trpc.payment.updateSettings.useMutation({
    onSuccess: () => {
      utils.payment.getSettings.invalidate();
    },
  });
};

export const useCreateOnboardingLink = () => {
  return trpc.payment.createOnboardingLink.useMutation();
};

export const useRefreshConnectStatus = () => {
  const utils = trpc.useUtils();
  return trpc.payment.refreshConnectStatus.useMutation({
    onSuccess: () => {
      utils.payment.getSettings.invalidate();
    },
  });
};

export const useGetDashboardLink = () => {
  return trpc.payment.getDashboardLink.useMutation();
};

export const useTrainerPricing = (trainerId: string) => {
  return trpc.payment.getTrainerPricing.useQuery(
    { trainerId },
    { enabled: !!trainerId }
  );
};

export const useCreatePaymentIntent = () => {
  return trpc.payment.createPaymentIntent.useMutation();
};

export const usePaymentStatus = (bookingId: string) => {
  return trpc.payment.getPaymentStatus.useQuery(
    { bookingId },
    { enabled: !!bookingId }
  );
};

export const usePaymentRequirement = (trainerId: string, clientRosterId: string) => {
  return trpc.payment.getPaymentRequirement.useQuery(
    { trainerId, clientRosterId },
    { enabled: !!trainerId && !!clientRosterId }
  );
};
