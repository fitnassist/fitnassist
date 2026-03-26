import { trpc } from '@/lib/trpc';

export const useCreatePost = () => {
  const utils = trpc.useUtils();
  return trpc.post.create.useMutation({
    onSuccess: () => {
      utils.post.getFeed.invalidate();
      utils.post.getUserPosts.invalidate();
    },
  });
};

export const useDeletePost = () => {
  const utils = trpc.useUtils();
  return trpc.post.delete.useMutation({
    onSuccess: () => {
      utils.post.getFeed.invalidate();
      utils.post.getUserPosts.invalidate();
    },
  });
};

export const useLikePost = () => {
  const utils = trpc.useUtils();
  return trpc.post.like.useMutation({
    onSuccess: () => {
      utils.post.getFeed.invalidate();
      utils.post.getUserPosts.invalidate();
    },
  });
};

export const useUnlikePost = () => {
  const utils = trpc.useUtils();
  return trpc.post.unlike.useMutation({
    onSuccess: () => {
      utils.post.getFeed.invalidate();
      utils.post.getUserPosts.invalidate();
    },
  });
};

export const useLikeDiaryEntry = () => {
  const utils = trpc.useUtils();
  return trpc.post.likeDiaryEntry.useMutation({
    onSuccess: () => {
      utils.diary.getEntries.invalidate();
    },
  });
};

export const useUnlikeDiaryEntry = () => {
  const utils = trpc.useUtils();
  return trpc.post.unlikeDiaryEntry.useMutation({
    onSuccess: () => {
      utils.diary.getEntries.invalidate();
    },
  });
};

export const useFeed = (limit = 20) => {
  return trpc.post.getFeed.useInfiniteQuery(
    { limit },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );
};

export const useUserPosts = (userId: string, limit = 20, enabled = true) => {
  return trpc.post.getUserPosts.useInfiniteQuery(
    { userId, limit },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled,
    }
  );
};

export const usePostLikers = (postId: string, enabled = true) => {
  return trpc.post.getPostLikers.useQuery({ postId }, { enabled });
};

export const useDiaryEntryLikers = (diaryEntryId: string, enabled = true) => {
  return trpc.post.getDiaryEntryLikers.useQuery({ diaryEntryId }, { enabled });
};

export const useNewFeedCount = (enabled = true) => {
  return trpc.post.getNewFeedCount.useQuery(undefined, { enabled });
};

export const useMarkFeedViewed = () => {
  const utils = trpc.useUtils();
  return trpc.post.markFeedViewed.useMutation({
    onSuccess: () => {
      utils.post.getNewFeedCount.invalidate();
    },
  });
};
