import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, Card, CardContent } from '@/components/ui';
import { routes } from '@/config/routes';
import type { SubscriptionTier } from '@fitnassist/database';
import { TIER_INFO } from '@fitnassist/schemas';

interface UpgradePromptProps {
  requiredTier: SubscriptionTier;
  featureName?: string;
}

export const UpgradePrompt = ({ requiredTier, featureName }: UpgradePromptProps) => {
  const tierName = requiredTier === 'FREE'
    ? 'Free'
    : TIER_INFO[requiredTier as keyof typeof TIER_INFO]?.name ?? requiredTier;

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-3 mb-4">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          {featureName ? `${featureName} requires ${tierName}` : `Upgrade to ${tierName}`}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          This feature is available on the {tierName} plan and above.
          Upgrade your subscription to unlock it.
        </p>
        <Link to={routes.pricing}>
          <Button>View Plans</Button>
        </Link>
      </CardContent>
    </Card>
  );
};
