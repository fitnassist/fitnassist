import { UserPlus } from 'lucide-react';
import { PageLayout } from '@/components/layouts';
import { ReferralLinkCard, ReferralStats, ReferralHistory } from './components';

export const ReferralsPage = () => {
  return (
    <PageLayout maxWidth="4xl">
      <PageLayout.Header
        title="Referrals"
        description="Refer other trainers to Fitnassist and earn free months"
        icon={<UserPlus className="h-6 w-6" />}
      />
      <PageLayout.Content>
        <ReferralLinkCard />
        <ReferralStats />
        <ReferralHistory />
      </PageLayout.Content>
    </PageLayout>
  );
};
