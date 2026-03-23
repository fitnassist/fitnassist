import { useSearchParams, Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { routes } from '@/config/routes';
import { LoginForm } from './components';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const message = searchParams.get('message');
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect if already logged in
  if (isAuthenticated && !isLoading) {
    return <Navigate to={routes.dashboard} replace />;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
        <CardDescription>
          Sign in to your Fitnassist account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {message === 'password_reset' && (
          <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm p-3 rounded-md mb-4">
            Your password has been reset. Please sign in with your new password.
          </div>
        )}
        <LoginForm />
      </CardContent>
    </Card>
  );
}
