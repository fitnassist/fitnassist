import { ReferralLinkCard, ReferralStats, ReferralHistory } from './components';

export const ReferralsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Referrals</h1>
        <p className="text-muted-foreground">
          Refer other trainers to Fitnassist and earn free months.
        </p>
      </div>

      <ReferralLinkCard />
      <ReferralStats />
      <ReferralHistory />
    </div>
  );
};
