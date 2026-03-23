import { useMemo } from 'react';
import { Home, MessageCircle, Phone, User, UserCircle, Users, BookOpen, ClipboardList, ClipboardCheck, BookHeart, Target } from 'lucide-react';
import { routes } from '@/config/routes';
import type { NavItem } from '@/components/layouts';
import type { DashboardNavItem, BadgeCounts } from '../DashboardLayout.types';

const BASE_NAV_ITEMS: DashboardNavItem[] = [
  {
    label: 'Dashboard',
    href: routes.dashboard,
    icon: <Home className="h-5 w-5" />,
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
  },
  {
    label: 'Clients',
    href: routes.dashboardClients,
    icon: <Users className="h-5 w-5" />,
    roles: ['TRAINER'] as const,
  },
  {
    label: 'Onboarding',
    href: routes.dashboardOnboarding,
    icon: <ClipboardCheck className="h-5 w-5" />,
    roles: ['TRAINER'] as const,
    badgeKey: 'onboarding' as const,
  },
  {
    label: 'Resources',
    href: routes.dashboardResources,
    icon: <BookOpen className="h-5 w-5" />,
    roles: ['TRAINER'] as const,
  },
  {
    label: 'Diary',
    href: routes.dashboardDiary,
    icon: <BookHeart className="h-5 w-5" />,
    roles: ['TRAINEE'] as const,
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
    label: 'My Profile',
    href: routes.traineeProfileEdit,
    icon: <UserCircle className="h-5 w-5" />,
    roles: ['TRAINEE'] as const,
  },
];

export const useNavItems = (
  isTrainer: boolean,
  badgeCounts: BadgeCounts
): NavItem[] => {
  return useMemo(() => {
    return BASE_NAV_ITEMS
      .filter((item) => {
        if (!item.roles) return true;
        if (isTrainer && item.roles.includes('TRAINER')) return true;
        if (!isTrainer && item.roles.includes('TRAINEE')) return true;
        return false;
      })
      .map(({ roles: _roles, badgeKey, ...item }) => ({
        ...item,
        badge: badgeKey ? badgeCounts[badgeKey] : undefined,
      }));
  }, [isTrainer, badgeCounts]);
};
