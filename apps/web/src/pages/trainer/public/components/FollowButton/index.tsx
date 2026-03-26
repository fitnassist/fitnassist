import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { useFollow, useUnfollow, useIsFollowing, useFollowCounts } from '@/api/follow';
import { useAuth } from '@/hooks';

interface FollowButtonProps {
  trainerUserId: string;
}

export const FollowButton = ({ trainerUserId }: FollowButtonProps) => {
  const { isAuthenticated, isTrainee, user } = useAuth();
  const { data: isFollowing, isLoading: checkingFollow } = useIsFollowing(
    trainerUserId,
    isAuthenticated && isTrainee,
  );
  const { data: counts } = useFollowCounts(trainerUserId);
  const followMutation = useFollow();
  const unfollowMutation = useUnfollow();

  // Don't show for trainers or unauthenticated users or self
  if (!isAuthenticated || !isTrainee || user?.id === trainerUserId) return null;

  const isMutating = followMutation.isPending || unfollowMutation.isPending;

  const handleToggle = () => {
    if (isFollowing) {
      unfollowMutation.mutate({ followingId: trainerUserId });
    } else {
      followMutation.mutate({ followingId: trainerUserId });
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        variant={isFollowing ? 'outline' : 'default'}
        size="sm"
        onClick={handleToggle}
        disabled={isMutating || checkingFollow}
      >
        {isMutating || checkingFollow ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        ) : isFollowing ? (
          <UserMinus className="mr-1.5 h-4 w-4" />
        ) : (
          <UserPlus className="mr-1.5 h-4 w-4" />
        )}
        {isFollowing ? 'Following' : 'Follow'}
      </Button>
      {counts && (
        <span className="text-sm text-muted-foreground">
          {counts.followers} {counts.followers === 1 ? 'follower' : 'followers'}
        </span>
      )}
    </div>
  );
};
