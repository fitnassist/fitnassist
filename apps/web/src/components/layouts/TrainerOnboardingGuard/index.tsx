import { Navigate, Outlet, useOutletContext } from 'react-router-dom';
import { routes } from '@/config/routes';
import { useRequireProfile } from '@/hooks';

export const TrainerOnboardingGuard = () => {
  const { needsOnboarding, isLoading } = useRequireProfile();
  // Forward context from parent layout to children
  const context = useOutletContext();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (needsOnboarding) {
    return <Navigate to={routes.trainerProfileCreate} replace />;
  }

  // Pass through the context from parent to children
  return <Outlet context={context} />;
};
