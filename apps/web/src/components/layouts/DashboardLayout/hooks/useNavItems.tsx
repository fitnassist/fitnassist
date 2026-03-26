import { useMemo } from 'react';
import { Home, MessageCircle, Phone, User, UserCircle, Users, BookOpen, ClipboardList, ClipboardCheck, BookHeart, Target, Calendar, BarChart3, Heart, Rss, Trophy } from 'lucide-react';
import { routes } from '@/config/routes';
import {
  FEATURE_TIER_MAP,
  hasFeatureAccess as checkAccess,
} from '@fitnassist/schemas';
import type { SubscriptionTier } from '@fitnassist/database';
import type { NavItem } from '@/components/layouts';
import type { DashboardNavItem, BadgeCounts } from '../DashboardLayout.types';

const TIER_LABELS: Partial<Record<SubscriptionTier, string>> = {
  FREE: 'Free',
  PRO: 'Pro',
  ELITE: 'Elite',
};

const BASE_NAV_ITEMS: DashboardNavItem[] = [
  {
    label: 'Dashboard',
    href: routes.dashboard,
    icon: <Home className="h-5 w-5" />,
    mobileBottom: true,
  },
  {
    label: 'Feed',
    href: routes.dashboardFeed,
    icon: <Rss className="h-5 w-5" />,
    roles: ['TRAINEE'] as const,
    badgeKey: 'newFeed' as const,
  },
  {
    label: 'Requests',
    href: routes.dashboardRequests,
    icon: <Phone className="h-5 w-5" />,
    roles: ['TRAINER'] as const,
    badgeKey: 'requests' as const,
  },
  {
    label: 'Messages',
    href: routes.dashboardMessages,
    icon: <MessageCircle className="h-5 w-5" />,
    badgeKey: 'messages' as const,
    mobileBottom: true,
  },
  {
    label: 'Clients',
    href: routes.dashboardClients,
    icon: <Users className="h-5 w-5" />,
    roles: ['TRAINER'] as const,
    requiredFeature: 'clientManagement',
  },
  {
    label: 'Onboarding',
    href: routes.dashboardOnboarding,
    icon: <ClipboardCheck className="h-5 w-5" />,
    roles: ['TRAINER'] as const,
    badgeKey: 'onboarding' as const,
    requiredFeature: 'clientManagement',
  },
  {
    label: 'Bookings',
    href: routes.dashboardBookings,
    icon: <Calendar className="h-5 w-5" />,
    requiredFeature: 'booking',
    mobileBottom: true,
  },
  {
    label: 'Analytics',
    href: routes.dashboardAnalytics,
    icon: <BarChart3 className="h-5 w-5" />,
    roles: ['TRAINER'] as const,
    requiredFeature: 'advancedAnalytics',
  },
  {
    label: 'Resources',
    href: routes.dashboardResources,
    icon: <BookOpen className="h-5 w-5" />,
    roles: ['TRAINER'] as const,
    requiredFeature: 'resources',
  },
  {
    label: 'Diary',
    href: routes.dashboardDiary,
    icon: <BookHeart className="h-5 w-5" />,
    roles: ['TRAINEE'] as const,
    mobileBottom: true,
  },
  {
    label: 'Goals',
    href: routes.dashboardGoals,
    icon: <Target className="h-5 w-5" />,
    roles: ['TRAINEE'] as const,
  },
  {
    label: 'My Plans',
    href: routes.dashboardMyPlans,
    icon: <ClipboardList className="h-5 w-5" />,
    roles: ['TRAINEE'] as const,
  },
  {
    label: 'My Contacts',
    href: routes.dashboardContacts,
    icon: <User className="h-5 w-5" />,
    roles: ['TRAINEE'] as const,
  },
  {
    label: 'Friends',
    href: routes.dashboardFriends,
    icon: <Heart className="h-5 w-5" />,
    roles: ['TRAINEE'] as const,
    badgeKey: 'friendRequests' as const,
  },
  {
    label: 'Leaderboards',
    href: routes.dashboardLeaderboards,
    icon: <Trophy className="h-5 w-5" />,
    roles: ['TRAINEE'] as const,
  },
  {
    label: 'My Profile',
    href: routes.traineeProfileEdit,
    icon: <UserCircle className="h-5 w-5" />,
    roles: ['TRAINEE'] as const,
  },
];

export const useNavItems = (
  isTrainer: boolean,
  badgeCounts: BadgeCounts,
  currentTier: SubscriptionTier = 'FREE'
): NavItem[] => {
  return useMemo(() => {
    return BASE_NAV_ITEMS
      .filter((item) => {
        if (!item.roles) return true;
        if (isTrainer && item.roles.includes('TRAINER')) return true;
        if (!isTrainer && item.roles.includes('TRAINEE')) return true;
        return false;
      })
      .map(({ roles: _roles, badgeKey, requiredFeature, mobileBottom, ...item }) => {
        // Only gate trainer features — trainees see bookings as gated on their trainer's tier,
        // but we only show the gate for trainer-side nav
        const isGated = isTrainer && requiredFeature && !checkAccess(currentTier, requiredFeature);
        const requiredTier = requiredFeature ? FEATURE_TIER_MAP[requiredFeature] : undefined;

        return {
          ...item,
          badge: badgeKey ? badgeCounts[badgeKey] : undefined,
          disabled: isGated || false,
          disabledTooltip: isGated && requiredTier
            ? `Upgrade to ${TIER_LABELS[requiredTier] ?? requiredTier} to unlock`
            : undefined,
          mobileBottom,
        };
      });
  }, [isTrainer, badgeCounts, currentTier]);
};
