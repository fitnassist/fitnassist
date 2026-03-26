import { useState } from 'react';
import { Users } from 'lucide-react';
import { Button, ConfirmDialog } from '@/components/ui';
import { useFriends, useRemoveFriend } from '@/api/friendship';
import { useAuth } from '@/hooks';
import { routes } from '@/config/routes';
import { UserCard } from '../UserCard';
import { hasVisibleFriendProfile } from '../../friends.utils';

export const FriendsList = () => {
  const { user } = useAuth();
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useFriends();
  const removeFriend = useRemoveFriend();

  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const friends = data?.pages.flatMap((page) => page.items) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="text-sm font-medium">No friends yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Send friend requests to connect with other users.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {friends.map((friendship) => {
        const friend =
          friendship.requester.id === user?.id
            ? friendship.addressee
            : friendship.requester;

        const tp = friend.traineeProfile;
        const handle = tp?.handle;
        const avatarUrl = tp?.avatarUrl ?? friend.image;
        const profileUrl = hasVisibleFriendProfile(tp)
          ? routes.traineePublicProfile(handle ?? friend.id)
          : undefined;

        return (
          <UserCard
            key={friendship.id}
            name={friend.name}
            handle={handle}
            avatarUrl={avatarUrl}
            profileUrl={profileUrl}
          >
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmRemoveId(friendship.id)}
            >
              Remove
            </Button>
          </UserCard>
        );
      })}

      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmRemoveId}
        onOpenChange={(open) => {
          if (!open) setConfirmRemoveId(null);
        }}
        title="Remove friend"
        description="Are you sure you want to remove this friend? You can send a new request later."
        confirmLabel="Remove"
        variant="destructive"
        isLoading={removeFriend.isPending}
        onConfirm={() => {
          if (confirmRemoveId) {
            removeFriend.mutate({ friendshipId: confirmRemoveId });
          }
        }}
      />
    </div>
  );
};
