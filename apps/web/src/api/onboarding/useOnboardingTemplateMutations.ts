import { trpc } from '@/lib/trpc';

export const useCreateOnboardingTemplate = () => {
  const utils = trpc.useUtils();
  return trpc.onboarding.createTemplate.useMutation({
    onSuccess: () => {
      utils.onboarding.getTemplates.invalidate();
      utils.onboarding.getActiveTemplates.invalidate();
    },
  });
};

export const useUpdateOnboardingTemplate = () => {
  const utils = trpc.useUtils();
  return trpc.onboarding.updateTemplate.useMutation({
    onSuccess: (_data, variables) => {
      utils.onboarding.getTemplates.invalidate();
      utils.onboarding.getTemplate.invalidate({ id: variables.id });
      utils.onboarding.getActiveTemplates.invalidate();
    },
  });
};

export const useDeleteOnboardingTemplate = () => {
  const utils = trpc.useUtils();
  return trpc.onboarding.deleteTemplate.useMutation({
    onSuccess: () => {
      utils.onboarding.getTemplates.invalidate();
      utils.onboarding.getActiveTemplates.invalidate();
    },
  });
};
