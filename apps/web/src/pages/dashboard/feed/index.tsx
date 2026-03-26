import { Loader2 } from 'lucide-react';
import { PageLayout } from '@/components/layouts';
import { Button } from '@/components/ui';
import { useFeed } from '@/api/post';
import { CreatePostForm, PostCard, FeedEmpty } from './components';

export const FeedPage = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useFeed();

  const posts = data?.pages.flatMap((page) => page.items) ?? [];

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
          ) : posts.length === 0 ? (
            <FeedEmpty />
          ) : (
            <>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  id={post.id}
                  content={post.content}
                  imageUrl={post.imageUrl}
                  type={post.type}
                  visibility={post.visibility}
                  createdAt={post.createdAt as unknown as string}
                  user={post.user}
                  hasLiked={post.hasLiked}
                  likeCount={post.likeCount}
                />
              ))}

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
