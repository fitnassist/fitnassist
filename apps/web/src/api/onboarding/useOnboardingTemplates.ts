import { trpc } from '@/lib/trpc';

export const useOnboardingTemplates = () => {
  return trpc.onboarding.getTemplates.useQuery();
};

export const useOnboardingTemplate = (id: string) => {
  return trpc.onboarding.getTemplate.useQuery({ id }, { enabled: !!id });
};

export const useActiveTemplates = () => {
  return trpc.onboarding.getActiveTemplates.useQuery();
};
