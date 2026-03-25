import { useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { routes } from '@/config/routes';
import { Sidebar } from '@/components/layouts';
import { useTheme } from '@/providers';
import { useAuth, useSse } from '@/hooks';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { trpc } from '@/lib/trpc';
import { useSubscription } from '@/api/subscription';
import { useBadgeCounts, useNavItems } from './hooks';
import { DashboardHeader, MobileBottomNav } from './components';
import { TrialBanner } from '@/components/TrialBanner';

export type { DashboardContext, BadgeCounts } from './DashboardLayout.types';

export const DashboardLayout = () => {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { user, isLoading, isAuthenticated, isTrainer, signOut } = useAuth();

  // Fetch trainer profile for profile image (only for trainers)
  const { data: trainerProfile } = trpc.trainer.getMyProfile.useQuery(undefined, {
    enabled: isTrainer && isAuthenticated,
  });

  // Fetch trainee profile for avatar (only for trainees)
  const isTrainee = user?.role === 'TRAINEE';
  const { data: traineeProfile } = trpc.trainee.getMyProfile.useQuery(undefined, {
    enabled: isTrainee && isAuthenticated,
  });

  // Global SSE connection for real-time updates
  const { isConnected: sseConnected } = useSse();

  // Prompt for push notification permission on first login
  const { isSupported: pushSupported, permission: pushPermission, requestPermission } = usePushNotifications();
  useEffect(() => {
    if (isAuthenticated && pushSupported && pushPermission === 'default') {
      requestPermission();
    }
  }, [isAuthenticated, pushSupported, pushPermission, requestPermission]);

  // Get subscription tier for feature gating (trainers only)
  const { data: subscriptionData } = useSubscription(isTrainer);
  const currentTier = subscriptionData?.effectiveTier ?? 'FREE';

  // Get badge counts from custom hook
  const badgeCounts = useBadgeCounts(isAuthenticated, isTrainer, sseConnected);

  // Get filtered nav items with badges and feature gating
  const filteredNavItems = useNavItems(isTrainer, badgeCounts, currentTier);

  // Use profile image from trainer/trainee profile, otherwise fallback to user image
  const profileImage = isTrainer
    ? trainerProfile?.profileImageUrl
    : traineeProfile?.avatarUrl || user?.image;
  const displayName = isTrainer && trainerProfile ? trainerProfile.displayName : user?.name;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={routes.login} replace />;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="fixed inset-0 flex flex-col">
      {isTrainer && <TrialBanner />}
      <DashboardHeader
        isDark={isDark}
        onToggleTheme={toggleTheme}
        user={{
          name: displayName || user.name,
          image: profileImage ?? null,
          role: isTrainer ? 'Trainer' : 'Trainee',
        }}
        onSignOut={handleSignOut}
      />

      {/* Main area with sidebar and content */}
      <div className="flex-1 flex min-h-0">
        {/* Desktop Sidebar */}
        <Sidebar
          navItems={filteredNavItems}
          user={{
            name: displayName || user.name,
            image: profileImage ?? null,
            role: isTrainer ? 'Trainer' : 'Trainee',
          }}
          onSignOut={handleSignOut}
          currentPath={location.pathname}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-16 lg:pb-0">
          <Outlet context={{ badgeCounts, sseConnected }} />
        </main>
      </div>

      <MobileBottomNav navItems={filteredNavItems} currentPath={location.pathname} />
    </div>
  );
};
