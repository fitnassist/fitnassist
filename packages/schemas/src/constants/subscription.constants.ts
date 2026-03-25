import type { SubscriptionTier } from "@fitnassist/database";

// =============================================================================
// SUBSCRIPTION TIER HIERARCHY
// =============================================================================

export const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
  FREE: 0,
  BASIC: 1,
  PRO: 2,
  ELITE: 3,
} as const;

// =============================================================================
// FEATURE → TIER MAPPING
// =============================================================================

export type Feature =
  | "gallery"
  | "featuredSearch"
  | "videoIntro"
  | "clientManagement"
  | "resources"
  | "booking"
  | "advancedAnalytics"
  | "customBranding"
  | "prioritySupport"
  | "sessionPayments"
  | "customSubdomain";

export const FEATURE_TIER_MAP: Record<Feature, SubscriptionTier> = {
  gallery: "PRO",
  featuredSearch: "PRO",
  videoIntro: "PRO",
  clientManagement: "PRO",
  resources: "PRO",
  booking: "PRO",
  sessionPayments: "ELITE",
  advancedAnalytics: "ELITE",
  customBranding: "ELITE",
  prioritySupport: "ELITE",
  customSubdomain: "ELITE",
} as const;

// =============================================================================
// TIER DISPLAY INFO
// =============================================================================

export interface TierInfo {
  name: string;
  description: string;
  monthlyPricePence: number;
  annualPricePence: number;
  features: readonly string[];
}

export const TIER_INFO: Record<"PRO" | "ELITE", TierInfo> = {
  PRO: {
    name: "Pro",
    description: "Everything you need to manage clients",
    monthlyPricePence: 1999,
    annualPricePence: 19999,
    features: [
      "Profile gallery & video intro",
      "Featured in search results",
      "Client management",
      "Resources library",
      "Booking & scheduling",
      "Everything in Free",
    ],
  },
  ELITE: {
    name: "Elite",
    description: "Premium tools for top trainers",
    monthlyPricePence: 4999,
    annualPricePence: 49999,
    features: [
      "Session payment handling",
      "Advanced analytics",
      "Product storefront",
      "Custom branding",
      "Priority support",
      "Website builder",
      "Everything in Pro",
    ],
  },
} as const;

export const FREE_TIER_INFO = {
  name: "Free",
  description: "Get started",
  monthlyPricePence: 0,
  annualPricePence: 0,
  features: ["Basic profile & listing", "Connections & messaging"],
} as const;

// =============================================================================
// TRIAL
// =============================================================================

export const TRIAL_DURATION_DAYS = 30;
export const TRIAL_TIER: SubscriptionTier = "PRO";

// =============================================================================
// HELPERS
// =============================================================================

export const hasFeatureAccess = (
  currentTier: SubscriptionTier,
  feature: Feature,
): boolean => {
  const requiredTier = FEATURE_TIER_MAP[feature];
  return TIER_HIERARCHY[currentTier] >= TIER_HIERARCHY[requiredTier];
};

export const formatPricePence = (pence: number): string => {
  const pounds = pence / 100;
  return pounds % 1 === 0 ? `£${pounds}` : `£${pounds.toFixed(2)}`;
};
