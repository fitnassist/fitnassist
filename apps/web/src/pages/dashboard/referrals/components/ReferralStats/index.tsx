import { Users, UserCheck, Clock, Gift } from 'lucide-react';
import { Card } from '@/components/ui';
import { useReferralStats } from '@/api/referral';

const stats = [
  { key: 'total', label: 'Total Referrals', icon: Users },
  { key: 'activated', label: 'Activated', icon: UserCheck },
  { key: 'pending', label: 'Pending', icon: Clock },
  { key: 'monthsEarned', label: 'Months Earned', icon: Gift },
] as const;

export const ReferralStats = () => {
  const { data, isLoading } = useReferralStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.key} className="p-4">
            <div className="h-16 bg-muted animate-pulse rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s) => {
        const Icon = s.icon;
        const value = data?.[s.key] ?? 0;
        return (
          <Card key={s.key} className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium">{s.label}</span>
            </div>
            <p className="text-2xl font-bold">{value}</p>
          </Card>
        );
      })}
    </div>
  );
};
