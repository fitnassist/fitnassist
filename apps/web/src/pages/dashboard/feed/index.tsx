import { Loader2 } from 'lucide-react';
import { PageLayout } from '@/components/layouts';
import { Button } from '@/components/ui';
import { useFeed } from '@/api/post';
import { CreatePostForm, PostCard, DiaryFeedCard, FeedEmpty } from './components';

export const FeedPage = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useFeed();

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <PageLayout>
      <PageLayout.Header
        title="Feed"
        description="See what your friends and trainers are up to."
      />
      <PageLayout.Content>
        <div className="mx-auto max-w-2xl space-y-4">
          <CreatePostForm />

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <FeedEmpty />
          ) : (
            <>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {items.map((item: any) =>
                item.itemType === 'post' ? (
                  <PostCard
                    key={`post-${item.id}`}
                    id={item.id}
                    content={item.content}
                    imageUrl={item.imageUrl}
                    type={item.type}
                    visibility={item.visibility}
                    createdAt={String(item.createdAt)}
                    user={item.user}
                    hasLiked={item.hasLiked}
                    likeCount={item.likeCount}
                  />
                ) : (
                  <DiaryFeedCard
                    key={`diary-${item.id}`}
                    id={item.id}
                    type={item.type}
                    date={String(item.date)}
                    createdAt={String(item.createdAt)}
                    hasLiked={item.hasLiked}
                    likeCount={item.likeCount}
                    user={item.user}
                    weightEntry={item.weightEntry}
                    waterEntry={item.waterEntry}
                    moodEntry={item.moodEntry}
                    sleepEntry={item.sleepEntry}
                    stepsEntry={item.stepsEntry}
                    activityEntry={item.activityEntry}
                    workoutLogEntry={item.workoutLogEntry}
                    foodEntryCount={item.foodEntryCount}
                  />
                )
              )}

              {hasNextPage && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Load more
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </PageLayout.Content>
    </PageLayout>
  );
};

export default FeedPage;
