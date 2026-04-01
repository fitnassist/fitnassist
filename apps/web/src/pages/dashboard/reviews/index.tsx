import { Star } from 'lucide-react';
import { Card, CardContent, StarRating, Button, Skeleton } from '@/components/ui';
import { PageLayout } from '@/components/layouts';
import { useDashboardReviews } from '@/api/review';
import { trpc } from '@/lib/trpc';
import { DashboardReviewCard } from './components';

export const ReviewsPage = () => {
  const { data: profile, isLoading: profileLoading } = trpc.trainer.getMyProfile.useQuery();
  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useDashboardReviews();

  const reviews = reviewsData?.pages.flatMap((page) => page.reviews) ?? [];
  const ratingAverage = profile?.ratingAverage ?? 0;
  const ratingCount = profile?.ratingCount ?? 0;

  return (
    <PageLayout maxWidth="4xl">
      <PageLayout.Header
        title="Reviews"
        description="See what your clients are saying"
        icon={<Star className="h-6 w-6" />}
      />
      <PageLayout.Content>
        <div className="space-y-6">
          {/* Aggregate stats */}
          {profileLoading ? (
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ) : ratingCount > 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <span className="text-4xl font-bold">{ratingAverage.toFixed(1)}</span>
                    <StarRating rating={ratingAverage} size="md" className="mt-1 justify-center" />
                    <p className="text-sm text-muted-foreground mt-1">
                      {ratingCount} {ratingCount === 1 ? 'review' : 'reviews'}
                    </p>
                  </div>
                  <div className="flex-1">
                    <RatingBreakdown reviews={reviews} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Reviews list */}
          <Card>
            <CardContent className="p-6">
              {reviewsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg mb-2">No reviews yet</h3>
                  <p className="text-muted-foreground text-sm">
                    Reviews from your clients will appear here after they complete sessions with
                    you.
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y">
                    {reviews.map((review) => (
                      <DashboardReviewCard key={review.id} review={review} />
                    ))}
                  </div>

                  {hasNextPage && (
                    <div className="mt-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                      >
                        {isFetchingNextPage ? 'Loading...' : 'Load more reviews'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </PageLayout.Content>
    </PageLayout>
  );
};

interface RatingBreakdownProps {
  reviews: { rating: number }[];
}

const RatingBreakdown = ({ reviews }: RatingBreakdownProps) => {
  const total = reviews.length;
  if (total === 0) return null;

  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="space-y-1.5">
      {counts.map(({ star, count }) => {
        const percentage = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={star} className="flex items-center gap-2 text-sm">
            <span className="w-3 text-muted-foreground">{star}</span>
            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500 rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="w-8 text-xs text-muted-foreground text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );
};
