import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { Button } from '@/components/ui';
import { HeroBanner } from '@/components/HeroBanner';
import { useSubscription, useCreateCheckoutSession } from '@/api/subscription';
import { TIER_INFO, FREE_TIER_INFO } from '@fitnassist/schemas';
import type { BillingPeriod } from '@fitnassist/database';
import { routes } from '@/config/routes';
import { PricingCard, PricingToggle } from './components';

export const PricingPage = () => {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('MONTHLY');
  const { isAuthenticated, isTrainer } = useAuth();
  const { data: subscriptionData } = useSubscription(isAuthenticated && isTrainer);
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
    <div>
      {/* Hero banner */}
      <HeroBanner title="Pricing" imageUrl="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1920&q=80" />

      {/* Intro section - white bg */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-light uppercase tracking-wider mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Whether you're chasing your first fitness goal or growing a personal training business,
            Fitnassist has a plan that fits. Trainees always use the platform for free — and trainers
            can start with a full-featured 30-day Pro trial, no card required.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Pick the plan that matches where you are today. You can upgrade, downgrade, or cancel at any time.
          </p>
        </div>
      </section>

      {/* For Trainers section - dark bg */}
      <section className="bg-gradient-to-br from-[#20415c] to-[#5a0c30] py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-light mb-3 text-white uppercase tracking-wider">
              For Trainers
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Start free and upgrade as your business grows. All plans include a 30-day Pro trial.
            </p>
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

          {/* Billing toggle */}
          <div className="mt-8">
            <PricingToggle billingPeriod={billingPeriod} onChange={setBillingPeriod} />
          </div>

          {/* CTA */}
          {!isAuthenticated && (
            <div className="text-center mt-8">
              <Link to={routes.register}>
                <Button className="px-8 py-3 font-semibold uppercase tracking-wider">
                  Start Your Free Trial
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* For Trainees section - white bg */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-light uppercase tracking-wider mb-6">
            For Trainees
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Fitnassist is on a mission to get the world moving. Track your workouts, log your meals,
            monitor your progress, and connect with qualified personal trainers — all in one place.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Use Fitnassist on your own or pair up with a trainer who can view your diary, set goals,
            and keep you accountable. Find out how Fitnassist can help you{' '}
            <Link to={routes.trainers} className="text-primary hover:underline">reach your goals</Link>.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Fitnassist is <strong>FREE</strong> for trainees, forever. Ready to start your fitness journey?
          </p>
          {!isAuthenticated && (
            <Link to={routes.register}>
              <Button className="px-8 py-3 font-semibold uppercase tracking-wider">
                Sign Up Free
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
