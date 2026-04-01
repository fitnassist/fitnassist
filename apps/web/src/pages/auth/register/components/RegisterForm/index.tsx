import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { registerFormSchema, type RegisterFormInput } from '@fitnassist/schemas';
import { Button, Input } from '@/components/ui';
import { signUp } from '@/lib/auth-client';
import { trpc } from '@/lib/trpc';
import { SocialAuthButtons } from '@/components/SocialAuthButtons';
import type { RegisterFormProps } from './RegisterForm.types';

const inputClass = 'bg-white/10 border-white/20 text-white placeholder:text-white/40';

export function RegisterForm({ onSuccess, referralCode }: RegisterFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormInput>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      role: 'TRAINEE',
    },
  });

  const claimReferral = trpc.referral.claimReferral.useMutation();

  const onSubmit = async (data: RegisterFormInput) => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role,
        callbackURL: `${window.location.origin}/dashboard`,
      });

      if (result.error) {
        setError(result.error.message || 'Registration failed');
        return;
      }

      // Claim referral if a referral code was provided
      if (referralCode && result.data?.user?.id) {
        claimReferral.mutate({
          referralCode,
          userId: result.data.user.id,
        });
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
        <div className="text-primary font-medium">Registration successful!</div>
        <p className="text-sm text-white/60">
          Please check your email to verify your account before signing in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <SocialAuthButtons callbackURL="/select-role" disabled={isLoading} />

      {error && <div className="bg-red-500/20 text-red-200 text-sm p-3 rounded-md">{error}</div>}

      <div>
        <label
          htmlFor="name"
          className="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-2"
        >
          Name
        </label>
        <Input
          id="name"
          type="text"
          placeholder="Your name"
          className={inputClass}
          {...register('name')}
          disabled={isLoading}
        />
        {errors.name && <p className="text-sm text-red-300 mt-1">{errors.name.message}</p>}
      </div>

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
          placeholder="you@example.com"
          className={inputClass}
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
            placeholder="Create a password"
            className={inputClass}
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
        <p className="text-xs text-white/40 mt-1">
          At least 8 characters with uppercase, lowercase, and a number
        </p>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-2"
        >
          Confirm Password
        </label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your password"
            className={inputClass}
            {...register('confirmPassword')}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-300 mt-1">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-2">
          I am a
        </label>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="TRAINEE"
              {...register('role')}
              disabled={isLoading}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm text-white/80">Trainee</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="TRAINER"
              {...register('role')}
              disabled={isLoading}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm text-white/80">Personal Trainer</span>
          </label>
        </div>
      </div>

      <div className="text-center pt-2">
        <Button
          type="submit"
          disabled={isLoading}
          className="rounded-full px-10 uppercase tracking-wider font-semibold"
        >
          {isLoading ? 'Creating account...' : 'Sign Up'}
        </Button>
      </div>

      <p className="text-center text-sm text-white/60">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
