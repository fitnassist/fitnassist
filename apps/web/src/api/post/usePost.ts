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

const toggleLikeOptimistic = (
  utils: ReturnType<typeof trpc.useUtils>,
  postId: string,
  liked: boolean,
) => {
  const updatePages = (old: Record<string, unknown> | undefined) => {
    if (!old) return old;
    const pages = old.pages as Array<Record<string, unknown>>;
    return {
      ...old,
      pages: pages.map((page) => ({
        ...page,
        items: ((page.items ?? []) as Array<Record<string, unknown>>).map((item) =>
          item.id === postId
            ? {
                ...item,
                hasLiked: liked,
                likeCount: Math.max(0, (item.likeCount ?? 0) + (liked ? 1 : -1)),
              }
            : item,
        ),
      })),
    };
  };
  utils.post.getFeed.setInfiniteData({ limit: 20 }, updatePages);
  utils.post.getUserPosts.setInfiniteData({ userId: '', limit: 20 }, updatePages);
};

export const useLikePost = () => {
  const utils = trpc.useUtils();
  return trpc.post.like.useMutation({
    onMutate: async ({ postId }) => {
      toggleLikeOptimistic(utils, postId, true);
    },
    onError: (_err, { postId }) => {
      toggleLikeOptimistic(utils, postId, false);
    },
  });
};

export const useUnlikePost = () => {
  const utils = trpc.useUtils();
  return trpc.post.unlike.useMutation({
    onMutate: async ({ postId }) => {
      toggleLikeOptimistic(utils, postId, false);
    },
    onError: (_err, { postId }) => {
      toggleLikeOptimistic(utils, postId, true);
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
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );
};

export const useUserPosts = (userId: string, limit = 20, enabled = true) => {
  return trpc.post.getUserPosts.useInfiniteQuery(
    { userId, limit },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled,
    },
  );
};

export const usePostLikers = (postId: string, enabled = true) => {
  return trpc.post.getPostLikers.useQuery({ postId }, { enabled: enabled && !!postId });
};

export const useDiaryEntryLikers = (diaryEntryId: string, enabled = true) => {
  return trpc.post.getDiaryEntryLikers.useQuery(
    { diaryEntryId },
    { enabled: enabled && !!diaryEntryId },
  );
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
