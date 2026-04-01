import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { replyToReviewSchema, type ReplyToReviewInput } from '@fitnassist/schemas';
import { Avatar, AvatarImage, AvatarFallback, StarRating, Button, Textarea } from '@/components/ui';
import { useReplyToReview } from '@/api/review';
import { toast } from 'sonner';
import { MessageCircle, Loader2 } from 'lucide-react';

interface DashboardReviewCardProps {
  review: {
    id: string;
    rating: number;
    text: string;
    replyText: string | null;
    repliedAt: Date | null;
    createdAt: Date;
    reviewer: {
      id: string;
      name: string;
      image: string | null;
    };
  };
}

export const DashboardReviewCard = ({ review }: DashboardReviewCardProps) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const replyMutation = useReplyToReview();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ReplyToReviewInput>({
    resolver: zodResolver(replyToReviewSchema),
    defaultValues: {
      reviewId: review.id,
      replyText: '',
    },
  });

  const initials = review.reviewer.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const onSubmit = async (data: ReplyToReviewInput) => {
    try {
      await replyMutation.mutateAsync(data);
      toast.success('Reply posted');
      setShowReplyForm(false);
      reset();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to post reply';
      toast.error(message);
    }
  };

  return (
    <div className="py-5 first:pt-0">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          {review.reviewer.image && (
            <AvatarImage src={review.reviewer.image} alt={review.reviewer.name} />
          )}
          <AvatarFallback className="text-sm">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="font-medium text-sm">{review.reviewer.name}</span>
              <span className="text-xs text-muted-foreground ml-2">
                {new Date(review.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          <StarRating rating={review.rating} size="sm" className="mt-1" />

          <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">{review.text}</p>

          {/* Existing reply */}
          {review.replyText && (
            <div className="mt-3 pl-3 border-l-2 border-primary/20">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <MessageCircle className="h-3 w-3" />
                Your reply
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{review.replyText}</p>
            </div>
          )}

          {/* Reply button / form */}
          {!review.replyText && !showReplyForm && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => setShowReplyForm(true)}
            >
              <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
              Reply
            </Button>
          )}

          {showReplyForm && (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-3 space-y-2">
              <Textarea
                {...register('replyText')}
                placeholder="Write your reply..."
                rows={3}
                className="resize-none"
              />
              {errors.replyText && (
                <p className="text-sm text-destructive">{errors.replyText.message}</p>
              )}
              <div className="flex items-center gap-2 justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowReplyForm(false);
                    reset();
                  }}
                  disabled={replyMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={replyMutation.isPending}>
                  {replyMutation.isPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  )}
                  Post Reply
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
