import { ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui';
import { useBlockedUsers, useUnblockUser } from '@/api/friendship';
import { UserCard } from '../UserCard';

export const BlockedList = () => {
  const { data: blockedUsers, isLoading } = useBlockedUsers();
  const unblock = useUnblockUser();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (!blockedUsers || blockedUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ShieldOff className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No blocked users</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {blockedUsers.map((friendship) => (
        <UserCard
          key={friendship.id}
          name={friendship.addressee.name}
          handle={friendship.addressee.traineeProfile?.handle}
          avatarUrl={friendship.addressee.traineeProfile?.avatarUrl ?? friendship.addressee.image}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => unblock.mutate({ targetId: friendship.addressee.id })}
            disabled={unblock.isPending}
          >
            Unblock
          </Button>
        </UserCard>
      ))}
    </div>
  );
};
