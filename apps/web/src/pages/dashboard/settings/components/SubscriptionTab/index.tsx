import { Crown, ExternalLink, Clock } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@/components/ui';
import { SkeletonText } from '@/components/ui';
import { useSubscription, useCreatePortalSession } from '@/api/subscription';
import { TIER_INFO, FREE_TIER_INFO, formatPricePence } from '@fitnassist/schemas';
import { Link } from 'react-router-dom';
import { routes } from '@/config/routes';

export const SubscriptionTab = () => {
  const { data, isLoading } = useSubscription();
  const createPortal = useCreatePortalSession();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <SkeletonText className="h-6 w-40" />
          <SkeletonText className="h-4 w-60 mt-2" />
        </CardHeader>
        <CardContent>
          <SkeletonText className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const subscription = data?.subscription;
  const effectiveTier = data?.effectiveTier ?? 'FREE';
  const tierInfo = effectiveTier === 'FREE' ? FREE_TIER_INFO : TIER_INFO[effectiveTier as keyof typeof TIER_INFO];

  const isTrialing = subscription?.status === 'TRIALING';
  const isCanceling = subscription?.cancelAtPeriodEnd;

  const trialDaysLeft = isTrialing && subscription?.trialEndDate
    ? Math.max(0, Math.ceil((new Date(subscription.trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Current Plan
              </CardTitle>
              <CardDescription>
                {isTrialing
                  ? `Pro trial - ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} remaining`
                  : tierInfo?.name ?? 'Free'}
              </CardDescription>
            </div>
            <Badge variant={effectiveTier === 'FREE' ? 'secondary' : 'default'}>
              {effectiveTier}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isTrialing && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-sm">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <span>
                Your Pro trial ends on{' '}
                <strong>{new Date(subscription!.trialEndDate!).toLocaleDateString()}</strong>.
                Subscribe to keep access to all Pro features.
              </span>
            </div>
          )}

          {isCanceling && subscription?.currentPeriodEnd && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-sm">
              <Clock className="h-4 w-4 text-destructive shrink-0" />
              <span>
                Your subscription will end on{' '}
                <strong>{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</strong>.
              </span>
            </div>
          )}

          {subscription?.billingPeriod && subscription?.tier && subscription.tier !== 'FREE' && (
            <div className="text-sm text-muted-foreground">
              {formatPricePence(
                subscription.billingPeriod === 'ANNUAL'
                  ? TIER_INFO[subscription.tier as keyof typeof TIER_INFO]?.annualPricePence ?? 0
                  : TIER_INFO[subscription.tier as keyof typeof TIER_INFO]?.monthlyPricePence ?? 0
              )}
              /{subscription.billingPeriod === 'ANNUAL' ? 'year' : 'month'}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {subscription?.stripeSubscriptionId && (
              <Button
                variant="outline"
                onClick={() => createPortal.mutate()}
                disabled={createPortal.isPending}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {createPortal.isPending ? 'Redirecting...' : 'Manage Subscription'}
              </Button>
            )}
            <Link to={routes.pricing}>
              <Button variant={effectiveTier === 'FREE' || isTrialing ? 'default' : 'outline'}>
                {effectiveTier === 'FREE' || isTrialing ? 'Upgrade Plan' : 'Change Plan'}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Features list */}
      {tierInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Included Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {tierInfo.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
