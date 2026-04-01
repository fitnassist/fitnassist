import { useState } from 'react';
import { Flag, MessageCircle } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback, StarRating } from '@/components/ui';
import { useAuth } from '@/hooks';
import { ReportDialog } from './ReportDialog';

interface ReviewCardProps {
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

export const ReviewCard = ({ review }: ReviewCardProps) => {
  const { user } = useAuth();
  const [showReport, setShowReport] = useState(false);

  const initials = review.reviewer.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const canReport = user && user.id !== review.reviewer.id;

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
            {canReport && (
              <button
                type="button"
                onClick={() => setShowReport(true)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                title="Report review"
              >
                <Flag className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <StarRating rating={review.rating} size="sm" className="mt-1" />

          <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">{review.text}</p>

          {/* Trainer reply */}
          {review.replyText && (
            <div className="mt-3 pl-3 border-l-2 border-primary/20">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <MessageCircle className="h-3 w-3" />
                Trainer reply
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{review.replyText}</p>
            </div>
          )}
        </div>
      </div>

      {showReport && (
        <ReportDialog reviewId={review.id} open={showReport} onClose={() => setShowReport(false)} />
      )}
    </div>
  );
};
