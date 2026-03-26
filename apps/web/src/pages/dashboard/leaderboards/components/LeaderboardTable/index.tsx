import { Link } from 'react-router-dom';
import { Trophy, Medal } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui';
import { cn } from '@/lib/utils';
import { routes } from '@/config/routes';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  handle: string | null;
  avatarUrl: string | null;
  value: number;
  isCurrentUser: boolean;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  valueLabel: string;
  formatValue?: (value: number) => string;
}

const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const RankBadge = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
  return <span className="text-sm font-medium text-muted-foreground w-5 text-center">{rank}</span>;
};

export const LeaderboardTable = ({
  entries,
  valueLabel,
  formatValue = (v) => v.toLocaleString(),
}: LeaderboardTableProps) => {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Trophy className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No rankings yet for this period.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center px-3 py-2 text-xs font-medium text-muted-foreground">
        <span className="w-10">#</span>
        <span className="flex-1">User</span>
        <span className="text-right">{valueLabel}</span>
      </div>
      {entries.map((entry) => {
        const profileUrl = entry.handle
          ? routes.traineePublicProfile(entry.handle)
          : undefined;

        return (
          <div
            key={entry.userId}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg',
              entry.isCurrentUser && 'bg-coral-50 dark:bg-coral-950/20 border border-coral-200 dark:border-coral-800',
              entry.rank <= 3 && !entry.isCurrentUser && 'bg-muted/50'
            )}
          >
            <div className="w-7 flex justify-center">
              <RankBadge rank={entry.rank} />
            </div>

            <Link
              to={profileUrl ?? '#'}
              className="flex items-center gap-2.5 flex-1 min-w-0"
            >
              <Avatar className="h-8 w-8">
                {entry.avatarUrl && <AvatarImage src={entry.avatarUrl} alt={entry.name} />}
                <AvatarFallback className="text-xs">{getInitials(entry.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className={cn(
                  'text-sm font-medium truncate',
                  entry.isCurrentUser && 'text-coral-600 dark:text-coral-400'
                )}>
                  {entry.name}
                  {entry.isCurrentUser && <span className="text-xs ml-1">(You)</span>}
                </p>
                {entry.handle && (
                  <p className="text-xs text-muted-foreground truncate">@{entry.handle}</p>
                )}
              </div>
            </Link>

            <span className={cn(
              'text-sm font-semibold tabular-nums',
              entry.rank === 1 && 'text-yellow-600 dark:text-yellow-400',
              entry.isCurrentUser && 'text-coral-600 dark:text-coral-400'
            )}>
              {formatValue(entry.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
};
