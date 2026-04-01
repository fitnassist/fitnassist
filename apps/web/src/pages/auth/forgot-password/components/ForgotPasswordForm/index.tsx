import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { forgotPasswordFormSchema, type ForgotPasswordFormInput } from '@fitnassist/schemas';
import { Button, Input, Label } from '@/components/ui';
import { requestPasswordReset } from '@/lib/auth-client';
import { routes } from '@/config/routes';
import type { ForgotPasswordFormProps } from './ForgotPasswordForm.types';

export function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormInput>({
    resolver: zodResolver(forgotPasswordFormSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormInput) => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await requestPasswordReset({
        email: data.email,
        redirectTo: `${window.location.origin}${routes.resetPassword}`,
      });

      if (result.error) {
        setError(result.error.message || 'Failed to send reset email');
        return;
      }

      setIsSuccess(true);
      onSuccess?.();
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center space-y-4">
        <div className="text-green-600 dark:text-green-400 font-medium">Check your email</div>
        <p className="text-sm text-muted-foreground">
          If an account exists with that email, we've sent password reset instructions.
        </p>
        <Link to={routes.login} className="text-primary hover:underline text-sm">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>
      )}

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...register('email')}
          disabled={isLoading}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Send reset link'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{' '}
        <Link to={routes.login} className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
