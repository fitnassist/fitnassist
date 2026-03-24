import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { useSubscription, useCreateCheckoutSession } from '@/api/subscription';
import { TIER_INFO, FREE_TIER_INFO } from '@fitnassist/schemas';
import type { BillingPeriod } from '@fitnassist/database';
import { routes } from '@/config/routes';
import { PricingCard, PricingToggle } from './components';

export const PricingPage = () => {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('MONTHLY');
  const { isAuthenticated, isTrainer } = useAuth();
  const { data: subscriptionData } = useSubscription();
  const createCheckout = useCreateCheckoutSession();

  const currentTier = subscriptionData?.effectiveTier ?? 'FREE';

  const handleSelect = (tier: 'PRO') => {
    if (!isAuthenticated) {
      window.location.href = routes.register;
      return;
    }
    if (!isTrainer) return;

    createCheckout.mutate({ tier, billingPeriod });
  };

  return (
    <div className="py-12 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Plans for every trainer
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free and upgrade as your business grows. All plans include a 30-day Pro trial.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="mb-10">
          <PricingToggle billingPeriod={billingPeriod} onChange={setBillingPeriod} />
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <PricingCard
            tier="FREE"
            info={FREE_TIER_INFO}
            billingPeriod={billingPeriod}
            isCurrentPlan={currentTier === 'FREE'}
          />
          <PricingCard
            tier="PRO"
            info={TIER_INFO.PRO}
            billingPeriod={billingPeriod}
            isCurrentPlan={currentTier === 'PRO'}
            isPopular
            onSelect={() => handleSelect('PRO')}
            isLoading={createCheckout.isPending}
          />
          <PricingCard
            tier="ELITE"
            info={TIER_INFO.ELITE}
            billingPeriod={billingPeriod}
            isCurrentPlan={currentTier === 'ELITE'}
            comingSoon
          />
        </div>

        {/* CTA for non-authenticated users */}
        {!isAuthenticated && (
          <div className="text-center mt-10">
            <p className="text-muted-foreground mb-4">
              Ready to get started?
            </p>
            <Link
              to={routes.register}
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Create Your Account
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingPage;
