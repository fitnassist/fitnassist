import { Navigate, Outlet, useOutletContext } from 'react-router-dom';
import { routes } from '@/config/routes';
import { useAuth } from '@/hooks';
import type { UserRole } from '@fitnassist/database';

interface RoleGuardProps {
  allowedRoles: UserRole[];
}

export const RoleGuard = ({ allowedRoles }: RoleGuardProps) => {
  const { user, isLoading } = useAuth();
  const context = useOutletContext();

  if (isLoading) {
    return null;
  }

  if (!user || !allowedRoles.includes(user.role as UserRole)) {
    return <Navigate to={routes.dashboard} replace />;
  }

  return <Outlet context={context} />;
};
