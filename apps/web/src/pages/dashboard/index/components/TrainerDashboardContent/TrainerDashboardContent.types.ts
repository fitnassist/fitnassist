import type { BadgeCounts } from '@/components/layouts';

export interface TrainerDashboardContentProps {
  badgeCounts: BadgeCounts;
}

export interface TrainerProfile {
  displayName: string;
  handle: string;
  profileImageUrl: string | null;
  isPublished: boolean;
  city?: string | null;
  postcode?: string | null;
  services?: unknown[];
  qualifications?: unknown[];
}
