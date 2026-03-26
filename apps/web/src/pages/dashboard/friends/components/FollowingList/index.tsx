import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Button, ConfirmDialog } from '@/components/ui';
import { useFollowing, useUnfollow } from '@/api/follow';
import { useAuth } from '@/hooks';
import { routes } from '@/config/routes';
import { UserCard } from '../UserCard';

export const FollowingList = () => {
  const { user } = useAuth();
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useFollowing(
    user?.id ?? '',
    20,
  );
  const unfollow = useUnfollow();

  const [confirmUnfollowId, setConfirmUnfollowId] = useState<string | null>(null);

  const following = data?.pages.flatMap((page) => page.items) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (following.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Heart className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="text-sm font-medium">Not following any trainers yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Browse trainers to find someone to follow.
        </p>
        <Button variant="outline" size="sm" className="mt-4" asChild>
          <Link to={routes.trainers}>Browse trainers</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {following.map((follow) => {
        const trainer = follow.following;
        const handle = trainer.trainerProfile?.handle;
        const avatarUrl = trainer.trainerProfile?.profileImageUrl ?? trainer.image;
        const profileUrl = handle ? routes.trainerPublicProfile(handle) : undefined;

        return (
          <UserCard
            key={follow.id}
            name={trainer.name}
            handle={handle}
            avatarUrl={avatarUrl}
            profileUrl={profileUrl}
          >
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmUnfollowId(trainer.id)}
            >
              Unfollow
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
        open={!!confirmUnfollowId}
        onOpenChange={(open) => {
          if (!open) setConfirmUnfollowId(null);
        }}
        title="Unfollow trainer"
        description="Are you sure you want to unfollow this trainer? You can follow them again later."
        confirmLabel="Unfollow"
        variant="destructive"
        isLoading={unfollow.isPending}
        onConfirm={() => {
          if (confirmUnfollowId) {
            unfollow.mutate({ followingId: confirmUnfollowId });
          }
        }}
      />
    </div>
  );
};
