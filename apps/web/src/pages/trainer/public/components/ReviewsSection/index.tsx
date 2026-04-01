import { useState } from 'react';
import { Star, Pencil } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  StarRating,
  Skeleton,
} from '@/components/ui';
import { useTrainerReviews, useReviewEligibility } from '@/api/review';
import { useAuth } from '@/hooks';
import { ReviewCard } from './ReviewCard';
import { ReviewForm } from './ReviewForm';

interface ReviewsSectionProps {
  trainerId: string;
  ratingAverage: number;
  ratingCount: number;
}

export const ReviewsSection = ({ trainerId, ratingAverage, ratingCount }: ReviewsSectionProps) => {
  const { isAuthenticated } = useAuth();
  const [showForm, setShowForm] = useState(false);

  const { data: eligibility } = useReviewEligibility(trainerId, isAuthenticated);

  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useTrainerReviews(trainerId);

  const reviews = reviewsData?.pages.flatMap((page) => page.reviews) ?? [];
  const canWriteReview = eligibility?.eligible && !eligibility.existingReview;
  const canEditReview = !!eligibility?.existingReview;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Reviews
          </CardTitle>
          {isAuthenticated && !showForm && (
            <>
              {canWriteReview && (
                <Button size="sm" onClick={() => setShowForm(true)}>
                  Write a Review
                </Button>
              )}
              {canEditReview && (
                <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit Review
                </Button>
              )}
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Aggregate summary */}
        {ratingCount > 0 && (
          <div className="flex items-center gap-3 mb-6 pb-6 border-b">
            <span className="text-3xl font-semibold">{ratingAverage.toFixed(1)}</span>
            <div>
              <StarRating rating={ratingAverage} size="md" />
              <p className="text-sm text-muted-foreground mt-0.5">
                {ratingCount} {ratingCount === 1 ? 'review' : 'reviews'}
              </p>
            </div>
          </div>
        )}

        {/* Review form */}
        {showForm && (
          <div className="mb-6 pb-6 border-b">
            <ReviewForm
              trainerId={trainerId}
              existingReview={eligibility?.existingReview}
              onCancel={() => setShowForm(false)}
              onSuccess={() => setShowForm(false)}
            />
          </div>
        )}

        {/* Reviews list */}
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
          <p className="text-sm text-muted-foreground text-center py-4">
            No reviews yet.
            {isAuthenticated && eligibility?.eligible && ' Be the first to leave a review!'}
          </p>
        ) : (
          <>
            <div className="divide-y">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
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
  );
};
