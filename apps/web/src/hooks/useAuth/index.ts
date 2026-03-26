import { useNavigate } from 'react-router-dom';
import { useSession, signOut } from '@/lib/auth-client';
import { queryClient } from '@/lib/queryClient';
import { routes } from '@/config/routes';
import type { UserRole } from '@fitnassist/types';
import type { AuthUser, UseAuthReturn } from './useAuth.types';

export function useAuth(): UseAuthReturn {
  const { data, isPending } = useSession();
  const navigate = useNavigate();

  const user: AuthUser | null = data?.user
    ? {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        image: data.user.image ?? null,
        role: (data.user.role as UserRole) ?? 'TRAINEE',
      }
    : null;

  const handleSignOut = async () => {
    await signOut();
    queryClient.clear();
    navigate(routes.home);
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading: isPending,
    isTrainer: user?.role === 'TRAINER',
    isTrainee: user?.role === 'TRAINEE',
    signOut: handleSignOut,
  };
}

export type { AuthUser, UseAuthReturn } from './useAuth.types';
