import { trpc } from '@/lib/trpc';

export const useSendFriendRequest = () => {
  const utils = trpc.useUtils();
  return trpc.friendship.sendRequest.useMutation({
    onSuccess: () => {
      utils.friendship.getStatus.invalidate();
      utils.friendship.getSentRequests.invalidate();
    },
  });
};

export const useAcceptFriendRequest = () => {
  const utils = trpc.useUtils();
  return trpc.friendship.acceptRequest.useMutation({
    onSuccess: () => {
      utils.friendship.getPendingRequests.invalidate();
      utils.friendship.getPendingCount.invalidate();
      utils.friendship.getFriends.invalidate();
      utils.friendship.getStatus.invalidate();
    },
  });
};

export const useDeclineFriendRequest = () => {
  const utils = trpc.useUtils();
  return trpc.friendship.declineRequest.useMutation({
    onSuccess: () => {
      utils.friendship.getPendingRequests.invalidate();
      utils.friendship.getPendingCount.invalidate();
      utils.friendship.getStatus.invalidate();
    },
  });
};

export const useRemoveFriend = () => {
  const utils = trpc.useUtils();
  return trpc.friendship.removeFriend.useMutation({
    onSuccess: () => {
      utils.friendship.getFriends.invalidate();
      utils.friendship.getStatus.invalidate();
    },
  });
};

export const useBlockUser = () => {
  const utils = trpc.useUtils();
  return trpc.friendship.blockUser.useMutation({
    onSuccess: () => {
      utils.friendship.getBlockedUsers.invalidate();
      utils.friendship.getStatus.invalidate();
      utils.friendship.getFriends.invalidate();
    },
  });
};

export const useUnblockUser = () => {
  const utils = trpc.useUtils();
  return trpc.friendship.unblockUser.useMutation({
    onSuccess: () => {
      utils.friendship.getBlockedUsers.invalidate();
      utils.friendship.getStatus.invalidate();
    },
  });
};

export const useFriends = (limit = 20) => {
  return trpc.friendship.getFriends.useInfiniteQuery(
    { limit },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );
};

export const usePendingRequests = (limit = 20) => {
  return trpc.friendship.getPendingRequests.useInfiniteQuery(
    { limit },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );
};

export const useSentRequests = (limit = 20) => {
  return trpc.friendship.getSentRequests.useInfiniteQuery(
    { limit },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );
};

export const useFriendshipStatus = (targetId: string, enabled = true) => {
  return trpc.friendship.getStatus.useQuery({ targetId }, { enabled });
};

export const useAreFriends = (targetId: string, enabled = true) => {
  return trpc.friendship.areFriends.useQuery({ targetId }, { enabled });
};

export const usePendingFriendCount = (enabled = true) => {
  return trpc.friendship.getPendingCount.useQuery(undefined, { enabled });
};

export const useBlockedUsers = () => {
  return trpc.friendship.getBlockedUsers.useQuery();
};
