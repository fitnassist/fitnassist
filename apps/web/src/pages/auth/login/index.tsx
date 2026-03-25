import { useSearchParams, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { routes } from "@/config/routes";
import { LoginForm } from "./components";

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const message = searchParams.get("message");
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect if already logged in
  if (isAuthenticated && !isLoading) {
    return <Navigate to={routes.dashboard} replace />;
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      {message === "password_reset" && (
        <div className="bg-green-500/20 text-green-200 text-sm p-3 rounded-md mb-6">
          Your password has been reset. Please sign in with your new password.
        </div>
      )}

      <LoginForm />
    </div>
  );
}
