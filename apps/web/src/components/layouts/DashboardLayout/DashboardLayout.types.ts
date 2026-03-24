import type { NavItem } from '@/components/layouts';
import type { Feature } from '@fitnassist/schemas';

export interface DashboardNavItem extends NavItem {
  roles?: ('TRAINER' | 'TRAINEE')[];
  badgeKey?: 'messages' | 'requests' | 'onboarding';
  requiredFeature?: Feature;
}

export interface BadgeCounts {
  messages: number;
  requests: number;
  onboarding: number;
}

export interface DashboardContext {
  badgeCounts: BadgeCounts;
  sseConnected: boolean;
}
