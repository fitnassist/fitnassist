import type { NavItem } from '@/components/layouts';
import type { Feature } from '@fitnassist/schemas';

export interface DashboardNavItem extends NavItem {
  roles?: ('TRAINER' | 'TRAINEE')[];
  badgeKey?:
    | 'messages'
    | 'requests'
    | 'onboarding'
    | 'friendRequests'
    | 'newFeed'
    | 'pendingBookings';
  requiredFeature?: Feature;
  mobileBottom?: boolean;
}

export interface BadgeCounts {
  messages: number;
  requests: number;
  onboarding: number;
  friendRequests: number;
  newFeed: number;
  pendingBookings: number;
}

export interface DashboardContext {
  badgeCounts: BadgeCounts;
  sseConnected: boolean;
}
