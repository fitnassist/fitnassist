import { trpc } from '@/lib/trpc';

export const useFollow = () => {
  const utils = trpc.useUtils();
  return trpc.follow.follow.useMutation({
    onSuccess: () => {
      utils.follow.isFollowing.invalidate();
      utils.follow.getFollowCounts.invalidate();
      utils.follow.getFollowing.invalidate();
    },
  });
};

export const useUnfollow = () => {
  const utils = trpc.useUtils();
  return trpc.follow.unfollow.useMutation({
    onSuccess: () => {
      utils.follow.isFollowing.invalidate();
      utils.follow.getFollowCounts.invalidate();
      utils.follow.getFollowing.invalidate();
    },
  });
};

export const useIsFollowing = (followingId: string, enabled = true) => {
  return trpc.follow.isFollowing.useQuery({ followingId }, { enabled });
};

export const useFollowCounts = (userId: string) => {
  return trpc.follow.getFollowCounts.useQuery({ userId });
};

export const useFollowers = (userId: string, limit = 20) => {
  return trpc.follow.getFollowers.useInfiniteQuery(
    { userId, limit },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );
};

export const useFollowing = (userId: string, limit = 20) => {
  return trpc.follow.getFollowing.useInfiniteQuery(
    { userId, limit },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );
};
