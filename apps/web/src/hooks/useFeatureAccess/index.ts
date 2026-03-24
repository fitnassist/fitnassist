import { useSubscription } from '@/api/subscription';
import {
  FEATURE_TIER_MAP,
  TIER_HIERARCHY,
  hasFeatureAccess as checkAccess,
  type Feature,
} from '@fitnassist/schemas';
import type { SubscriptionTier } from '@fitnassist/database';

interface FeatureAccessResult {
  hasAccess: boolean;
  requiredTier: SubscriptionTier;
  currentTier: SubscriptionTier;
  isLoading: boolean;
}

export const useFeatureAccess = (feature: Feature): FeatureAccessResult => {
  const { data, isLoading } = useSubscription();

  const currentTier: SubscriptionTier = data?.effectiveTier ?? 'FREE';
  const requiredTier = FEATURE_TIER_MAP[feature];
  const hasAccess = checkAccess(currentTier, feature);

  return {
    hasAccess,
    requiredTier,
    currentTier,
    isLoading,
  };
};

export const useTierAccess = (requiredTier: SubscriptionTier) => {
  const { data, isLoading } = useSubscription();

  const currentTier: SubscriptionTier = data?.effectiveTier ?? 'FREE';
  const hasAccess = TIER_HIERARCHY[currentTier] >= TIER_HIERARCHY[requiredTier];

  return {
    hasAccess,
    currentTier,
    requiredTier,
    isLoading,
  };
};
