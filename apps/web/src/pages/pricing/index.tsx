import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { Button } from '@/components/ui';
import { HeroBanner } from '@/components/HeroBanner';
import { useSubscription, useCreateCheckoutSession } from '@/api/subscription';
import { TIER_INFO, FREE_TIER_INFO } from '@fitnassist/schemas';
import type { BillingPeriod } from '@fitnassist/database';
import { routes } from '@/config/routes';
import { PricingCard, PricingToggle } from './components';

const useSlider = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const children = Array.from(el.children) as HTMLElement[];
    const center = el.scrollLeft + el.offsetWidth / 2;
    let closest = 0;
    let minDist = Infinity;
    children.forEach((child, i) => {
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const dist = Math.abs(center - childCenter);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });
    setActive(closest);
  }, []);

  return { ref, active, onScroll };
};

export const PricingPage = () => {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('MONTHLY');
  const pricingSlider = useSlider();
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
      <HeroBanner title="Pricing" imageUrl="/images/hero-pricing.jpg" />

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
          <div
            ref={pricingSlider.ref}
            onScroll={pricingSlider.onScroll}
            className="-mx-4 px-[10vw] md:mx-0 md:px-0 flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 md:pb-0 md:grid md:grid-cols-3 md:overflow-visible max-w-5xl md:mx-auto scrollbar-none"
          >
            <div className="min-w-[80vw] snap-center md:min-w-0">
              <PricingCard
                tier="FREE"
                info={FREE_TIER_INFO}
                billingPeriod={billingPeriod}
                isCurrentPlan={currentTier === 'FREE'}
              />
            </div>
            <div className="min-w-[80vw] snap-center md:min-w-0">
              <PricingCard
                tier="PRO"
                info={TIER_INFO.PRO}
                billingPeriod={billingPeriod}
                isCurrentPlan={currentTier === 'PRO'}
                isPopular
                onSelect={() => handleSelect('PRO')}
                isLoading={createCheckout.isPending}
              />
            </div>
            <div className="min-w-[80vw] snap-center md:min-w-0">
              <PricingCard
                tier="ELITE"
                info={TIER_INFO.ELITE}
                billingPeriod={billingPeriod}
                isCurrentPlan={currentTier === 'ELITE'}
                comingSoon
              />
            </div>
          </div>
          <div className="flex justify-center gap-2 mt-4 md:hidden">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i === pricingSlider.active ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
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
            <Link to={routes.trainers} className="text-coral hover:underline">reach your goals</Link>.
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
