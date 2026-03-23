// Auth hooks will be implemented with Better Auth
// Placeholder for now

export function useSession() {
  // TODO: Implement with Better Auth
  return {
    user: null,
    isLoading: false,
    isAuthenticated: false,
  };
}

export function useRequireAuth() {
  const session = useSession();
  // TODO: Redirect to login if not authenticated
  return session;
}
