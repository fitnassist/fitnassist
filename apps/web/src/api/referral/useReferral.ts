import { trpc } from '@/lib/trpc';
import type { ReferralHistoryInput } from '@fitnassist/schemas';

export const useReferralStats = () => {
  return trpc.referral.getStats.useQuery();
};

export const useReferralHistory = (input: ReferralHistoryInput) => {
  return trpc.referral.getHistory.useQuery(input);
};

export const useReferralLink = () => {
  return trpc.referral.getReferralLink.useQuery();
};
