import { useSession, signIn, signUp, signOut } from '@/lib/auth';

export const useAuth = () => {
  const session = useSession();

  const user = session.data?.user ?? null;
  const isLoading = session.isPending;
  const isAuthenticated = !!user;
  const role = user?.role ?? null;

  return {
    user,
    isLoading,
    isAuthenticated,
    role,
    signIn,
    signUp,
    signOut,
    refetch: session.refetch,
  };
};
