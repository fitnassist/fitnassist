import { useSearchParams } from 'react-router-dom';
import { Gift } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { RegisterForm } from './components';

export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');

  const { data: referrerInfo } = trpc.referral.getReferrerInfo.useQuery(
    { handle: referralCode! },
    { enabled: !!referralCode },
  );

  const handleSuccess = () => {
    // User needs to verify email, so we stay on this page with success message
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <h1 className="text-2xl font-light uppercase tracking-wider text-white text-center mb-8">
        Create Account
      </h1>
      {referralCode && referrerInfo && (
        <div className="mb-6 bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
          <Gift className="h-5 w-5 text-primary mx-auto mb-2" />
          <p className="text-sm text-white/80">
            You've been referred by{' '}
            <span className="font-semibold text-primary">{referrerInfo.displayName}</span>
          </p>
          <p className="text-xs text-white/60 mt-1">Get 20% off your first subscription payment!</p>
        </div>
      )}
      <RegisterForm onSuccess={handleSuccess} referralCode={referralCode} />
    </div>
  );
}
