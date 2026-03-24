import { Check } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Badge } from '@/components/ui';
import { formatPricePence, type TierInfo } from '@fitnassist/schemas';
import type { SubscriptionTier, BillingPeriod } from '@fitnassist/database';

interface PricingCardProps {
  tier: SubscriptionTier;
  info: TierInfo | { name: string; description: string; monthlyPricePence: number; annualPricePence: number; features: readonly string[] };
  billingPeriod: BillingPeriod;
  isCurrentPlan?: boolean;
  isPopular?: boolean;
  isLoading?: boolean;
  comingSoon?: boolean;
  onSelect?: () => void;
}

export const PricingCard = ({
  tier,
  info,
  billingPeriod,
  isCurrentPlan,
  isPopular,
  isLoading,
  comingSoon,
  onSelect,
}: PricingCardProps) => {
  const price = billingPeriod === 'ANNUAL' ? info.annualPricePence : info.monthlyPricePence;
  const monthlyEquivalent = billingPeriod === 'ANNUAL'
    ? info.annualPricePence / 12
    : info.monthlyPricePence;

  return (
    <Card className={`relative flex flex-col ${isPopular ? 'border-primary shadow-lg ring-1 ring-primary' : ''}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="default" className="px-3 py-1">Most Popular</Badge>
        </div>
      )}
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl">{info.name}</CardTitle>
        <CardDescription>{info.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        <div className="text-center mb-6">
          {tier === 'FREE' ? (
            <div className="text-4xl font-bold">Free</div>
          ) : (
            <>
              <div className="text-4xl font-bold">
                {formatPricePence(Math.round(monthlyEquivalent))}
                <span className="text-base font-normal text-muted-foreground">/mo</span>
              </div>
              {billingPeriod === 'ANNUAL' && (
                <p className="text-sm text-muted-foreground mt-1">
                  {formatPricePence(price)} billed annually
                </p>
              )}
            </>
          )}
        </div>

        <ul className="space-y-3 mb-6 flex-1">
          {info.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          className="w-full"
          variant={isPopular ? 'default' : 'outline'}
          disabled={isCurrentPlan || isLoading || tier === 'FREE' || comingSoon}
          onClick={onSelect}
        >
          {comingSoon ? 'Coming Soon' : isCurrentPlan ? 'Current Plan' : tier === 'FREE' ? 'Free Forever' : 'Get Started'}
        </Button>
      </CardContent>
    </Card>
  );
};
