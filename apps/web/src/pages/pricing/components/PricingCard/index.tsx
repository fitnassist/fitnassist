import { Check } from 'lucide-react';
import { Button } from '@/components/ui';
import { formatPricePence, type TierInfo } from '@fitnassist/schemas';
import type { SubscriptionTier, BillingPeriod } from '@fitnassist/database';

interface PricingCardProps {
  tier: SubscriptionTier;
  info:
    | TierInfo
    | {
        name: string;
        description: string;
        monthlyPricePence: number;
        annualPricePence: number;
        features: readonly string[];
      };
  billingPeriod: BillingPeriod;
  isCurrentPlan?: boolean;
  isPopular?: boolean;
  isLoading?: boolean;
  onSelect?: () => void;
}

export const PricingCard = ({
  tier,
  info,
  billingPeriod,
  isCurrentPlan,
  isPopular,
  isLoading,
  onSelect,
}: PricingCardProps) => {
  const price = billingPeriod === 'ANNUAL' ? info.annualPricePence : info.monthlyPricePence;
  const monthlyEquivalent =
    billingPeriod === 'ANNUAL' ? info.annualPricePence / 12 : info.monthlyPricePence;

  return (
    <div className="relative flex flex-col rounded-lg overflow-hidden border border-white/10">
      {/* Teal header */}
      <div className="bg-gradient-to-br from-[#4cd6c3] to-[#44c1af] text-center py-6 px-4">
        <h3 className="text-xl font-light text-white uppercase tracking-wider">{info.name}</h3>
        <div className="mt-2">
          <div className="text-3xl font-bold text-white">
            {formatPricePence(Math.round(tier === 'FREE' ? 0 : monthlyEquivalent))}
          </div>
          <p className="text-sm text-white/80 uppercase tracking-wider mt-1">Per Month</p>
        </div>
      </div>

      {/* White body with features */}
      <div className="bg-white flex flex-col flex-1 p-6">
        {billingPeriod === 'ANNUAL' && tier !== 'FREE' && (
          <p className="text-sm text-muted-foreground text-center mb-4">
            {formatPricePence(price)} billed annually
          </p>
        )}

        <ul className="space-y-3 mb-6 flex-1">
          {info.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span className="text-sm text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          className="w-full uppercase tracking-wider font-semibold"
          variant={isPopular ? 'default' : 'outline'}
          disabled={isCurrentPlan || isLoading || tier === 'FREE'}
          onClick={onSelect}
        >
          {isCurrentPlan ? 'Current Plan' : tier === 'FREE' ? 'Free Forever' : 'Get Started'}
        </Button>
      </div>
    </div>
  );
};
