import { Trophy } from 'lucide-react';

interface UserRankCardProps {
  rank: number;
  value: number;
  totalParticipants: number;
  valueLabel: string;
  formatValue?: (value: number) => string;
}

export const UserRankCard = ({
  rank,
  value,
  totalParticipants,
  valueLabel,
  formatValue = (v) => v.toLocaleString(),
}: UserRankCardProps) => {
  return (
    <div className="rounded-lg border bg-card p-4 flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-coral-100 dark:bg-coral-900/30">
        <Trophy className="h-6 w-6 text-coral-600 dark:text-coral-400" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">Your rank</p>
        <p className="text-2xl font-bold">
          #{rank}
          <span className="text-sm font-normal text-muted-foreground ml-1">
            of {totalParticipants}
          </span>
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm text-muted-foreground">{valueLabel}</p>
        <p className="text-xl font-semibold">{formatValue(value)}</p>
      </div>
    </div>
  );
};
