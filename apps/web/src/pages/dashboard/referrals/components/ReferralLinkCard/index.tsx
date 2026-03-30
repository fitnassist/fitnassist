import { useState } from 'react';
import { Copy, Check, Link as LinkIcon } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useReferralLink } from '@/api/referral';

export const ReferralLinkCard = () => {
  const { data, isLoading } = useReferralLink();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!data?.url) return;
    await navigator.clipboard.writeText(data.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="h-20 bg-muted animate-pulse rounded" />
      </Card>
    );
  }

  if (!data?.url) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-3">
        <LinkIcon className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Your Referral Link</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Share this link with other trainers. When they subscribe, you get 1 month free and they get 20% off their first payment.
      </p>
      <div className="flex gap-2">
        <div className="flex-1 bg-muted rounded-md px-3 py-2 text-sm font-mono truncate">
          {data.url}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="shrink-0"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
