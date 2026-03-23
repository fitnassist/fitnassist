import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { RegisterForm } from './components';

export function RegisterPage() {
  const handleSuccess = () => {
    // User needs to verify email, so we stay on this page with success message
    // Or navigate to a dedicated "check your email" page
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
        <CardDescription>
          Enter your details to get started with Fitnassist
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm onSuccess={handleSuccess} />
      </CardContent>
    </Card>
  );
}
