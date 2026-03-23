import type { NavItem } from '@/components/layouts';

export interface DashboardNavItem extends NavItem {
  roles?: ('TRAINER' | 'TRAINEE')[];
  badgeKey?: 'messages' | 'requests' | 'onboarding';
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
