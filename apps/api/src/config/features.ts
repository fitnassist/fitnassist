import type { SubscriptionTier } from '@fitnassist/database';

export type Feature =
  | 'gallery'
  | 'featuredSearch'
  | 'videoIntro'
  | 'clientManagement'
  | 'resources'
  | 'booking'
  | 'advancedAnalytics'
  | 'customBranding'
  | 'prioritySupport'
  | 'sessionPayments'
  | 'customSubdomain'
  | 'websiteBuilder';

export const FEATURE_TIER_MAP: Record<Feature, SubscriptionTier> = {
  gallery: 'PRO',
  featuredSearch: 'PRO',
  videoIntro: 'PRO',
  clientManagement: 'PRO',
  resources: 'PRO',
  booking: 'PRO',
  sessionPayments: 'ELITE',
  advancedAnalytics: 'ELITE',
  customBranding: 'ELITE',
  prioritySupport: 'ELITE',
  customSubdomain: 'ELITE',
  websiteBuilder: 'ELITE',
} as const;

export const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
  FREE: 0,
  BASIC: 1,
  PRO: 2,
  ELITE: 3,
} as const;

export const hasFeatureAccess = (
  currentTier: SubscriptionTier,
  feature: Feature
): boolean => {
  const requiredTier = FEATURE_TIER_MAP[feature];
  return TIER_HIERARCHY[currentTier] >= TIER_HIERARCHY[requiredTier];
};

export const hasTierAccess = (
  currentTier: SubscriptionTier,
  requiredTier: SubscriptionTier
): boolean => {
  return TIER_HIERARCHY[currentTier] >= TIER_HIERARCHY[requiredTier];
};
