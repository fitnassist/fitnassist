import { useOutletContext } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { useSession } from '@/lib/auth-client';
import { TraineeOnboardingBanner } from '@/components/layouts';
import { OnboardingBanner } from '@/components/layouts/OnboardingBanner';
import { GuidedTour } from '@/components/GuidedTour';
import { TraineeDashboardContent, TrainerDashboardContent } from './components';

interface DashboardContext {
  badgeCounts: {
    messages: number;
    requests: number;
    onboarding: number;
    friendRequests: number;
    newFeed: number;
    pendingBookings: number;
  };
}

export const DashboardPage = () => {
  const { user, isTrainer, isTrainee } = useAuth();
  const { data: session } = useSession();
  const context = useOutletContext<DashboardContext>();
  const badgeCounts = context?.badgeCounts ?? { messages: 0, requests: 0 };

  const sessionUser = session?.user as
    | (typeof session & {
        user: { webTourCompleted?: boolean; webTourSkippedAt?: string | null };
      })['user']
    | undefined;
  const showTour = sessionUser && !sessionUser.webTourCompleted && !sessionUser.webTourSkippedAt;

  return (
    <>
      {showTour && user?.role && <GuidedTour role={user.role as 'TRAINER' | 'TRAINEE'} />}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Hello {user?.name}</h1>
          <p className="text-muted-foreground mt-1">Welcome to your dashboard</p>
        </div>

        {isTrainee && <TraineeOnboardingBanner />}
        {isTrainee && <OnboardingBanner />}

        {isTrainer && <TrainerDashboardContent badgeCounts={badgeCounts} />}
        {isTrainee && <TraineeDashboardContent badgeCounts={badgeCounts} />}
      </div>
    </>
  );
};
