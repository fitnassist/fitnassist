import { Globe, Shield } from 'lucide-react';
import { Button } from '@/components/ui';
import { useSetLeaderboardOptIn } from '@/api/leaderboard';

interface OptInPromptProps {
  isOptedIn: boolean;
}

export const OptInPrompt = ({ isOptedIn }: OptInPromptProps) => {
  const setOptIn = useSetLeaderboardOptIn();

  if (isOptedIn) {
    return (
      <div className="rounded-lg border bg-card p-4 flex items-center gap-3">
        <Globe className="h-5 w-5 text-green-500 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">You're on the global leaderboard</p>
          <p className="text-xs text-muted-foreground">Others can see your rankings.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOptIn.mutate({ optedIn: false })}
          disabled={setOptIn.isPending}
        >
          Opt out
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed bg-muted/30 p-4 flex items-center gap-3">
      <Shield className="h-5 w-5 text-muted-foreground shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium">Join the global leaderboard</p>
        <p className="text-xs text-muted-foreground">
          Opt in to appear on global rankings. Your stats will be visible to other users.
        </p>
      </div>
      <Button
        size="sm"
        onClick={() => setOptIn.mutate({ optedIn: true })}
        disabled={setOptIn.isPending}
      >
        Opt in
      </Button>
    </div>
  );
};
