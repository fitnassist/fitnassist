import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createReviewSchema, type CreateReviewInput } from '@fitnassist/schemas';
import { Button, Textarea, Label } from '@/components/ui';
import { InteractiveStarRating } from '@/components/ui';
import { useCreateReview, useUpdateReview } from '@/api/review';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ReviewFormProps {
  trainerId: string;
  existingReview?: {
    id: string;
    rating: number;
    text: string;
  } | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export const ReviewForm = ({ trainerId, existingReview, onCancel, onSuccess }: ReviewFormProps) => {
  const isEditing = !!existingReview;
  const createReview = useCreateReview();
  const updateReview = useUpdateReview();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateReviewInput>({
    resolver: zodResolver(createReviewSchema),
    defaultValues: {
      trainerId,
      rating: existingReview?.rating ?? 0,
      text: existingReview?.text ?? '',
    },
  });

  const rating = watch('rating');
  const isPending = createReview.isPending || updateReview.isPending;

  const onSubmit = async (data: CreateReviewInput) => {
    try {
      if (isEditing && existingReview) {
        await updateReview.mutateAsync({
          id: existingReview.id,
          rating: data.rating,
          text: data.text,
        });
        toast.success('Review updated');
      } else {
        await createReview.mutateAsync(data);
        toast.success('Review submitted');
      }
      onSuccess();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to submit review';
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label className="mb-2 block">Rating</Label>
        <InteractiveStarRating
          value={rating}
          onChange={(value) => setValue('rating', value, { shouldValidate: true })}
        />
        {errors.rating && <p className="text-sm text-destructive mt-1">{errors.rating.message}</p>}
      </div>

      <div>
        <Label htmlFor="review-text" className="mb-2 block">
          Your review
        </Label>
        <Textarea
          id="review-text"
          {...register('text')}
          placeholder="Share your experience training with this trainer..."
          rows={4}
          className="resize-none"
        />
        {errors.text && <p className="text-sm text-destructive mt-1">{errors.text.message}</p>}
      </div>

      <div className="flex items-center gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || rating === 0}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {isEditing ? 'Update Review' : 'Submit Review'}
        </Button>
      </div>
    </form>
  );
};
