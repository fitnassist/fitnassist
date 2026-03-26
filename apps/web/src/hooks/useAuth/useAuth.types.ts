import type { UserRole } from '@fitnassist/types';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: UserRole;
}

export interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isTrainer: boolean;
  isTrainee: boolean;
  signOut: () => Promise<void>;
  refetchSession: () => void;
}
