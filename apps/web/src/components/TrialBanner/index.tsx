import { Clock, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '@/config/routes';
import { useSubscription } from '@/api/subscription';

export const TrialBanner = () => {
  const [dismissed, setDismissed] = useState(false);
  const { data } = useSubscription();

  const subscription = data?.subscription;
  const isTrialing = subscription?.status === 'TRIALING';

  if (!isTrialing || dismissed || !subscription?.trialEndDate) return null;

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(subscription.trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-primary shrink-0" />
          <span>
            <strong>
              {daysLeft} day{daysLeft !== 1 ? 's' : ''}
            </strong>{' '}
            left on your Pro trial.{' '}
            <Link to={routes.pricing} className="font-medium text-primary hover:underline">
              Subscribe now
            </Link>{' '}
            to keep all features.
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-primary/10 rounded"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};
