import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { loginFormSchema, type LoginFormInput } from '@fitnassist/schemas';
import { Button, Input } from '@/components/ui';
import { signIn } from '@/lib/auth-client';
import { routes } from '@/config/routes';
import { SocialAuthButtons } from '@/components/SocialAuthButtons';
import type { LoginFormProps } from './LoginForm.types';

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInput>({
    resolver: zodResolver(loginFormSchema),
  });

  const onSubmit = async (data: LoginFormInput) => {
    setError(null);
    setIsLoading(true);

    try {
      await signIn.email(
        {
          email: data.email,
          password: data.password,
        },
        {
          onSuccess: () => {
            navigate(routes.dashboard);
            onSuccess?.();
          },
          onError: (ctx) => {
            setError(ctx.error.message || 'Login failed');
            setIsLoading(false);
          },
        },
      );
    } catch {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <SocialAuthButtons callbackURL="/dashboard" disabled={isLoading} />

      {error && <div className="bg-red-500/20 text-red-200 text-sm p-3 rounded-md">{error}</div>}

      <div>
        <label
          htmlFor="email"
          className="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-2"
        >
          Email Address
        </label>
        <Input
          id="email"
          type="email"
          placeholder="john.doe@fitnassist.com"
          className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
          {...register('email')}
          disabled={isLoading}
        />
        {errors.email && <p className="text-sm text-red-300 mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-2"
        >
          Password
        </label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            {...register('password')}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-sm text-red-300 mt-1">{errors.password.message}</p>}
        <div className="flex justify-start mt-2">
          <Link to={routes.forgotPassword} className="text-sm text-primary hover:underline">
            Forgotten password?
          </Link>
        </div>
      </div>

      <div className="text-center pt-2">
        <Button
          type="submit"
          disabled={isLoading}
          className="rounded-full px-10 uppercase tracking-wider font-semibold"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </div>

      <p className="text-center text-sm text-white/60">
        Don't have an account?{' '}
        <Link to={routes.register} className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
