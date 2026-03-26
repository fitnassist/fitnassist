import { Heart } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  liked: boolean;
  count: number;
  onLike: () => void;
  onUnlike: () => void;
  disabled?: boolean;
}

export const LikeButton = ({ liked, count, onLike, onUnlike, disabled }: LikeButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5 text-muted-foreground hover:text-coral-500"
      onClick={liked ? onUnlike : onLike}
      disabled={disabled}
    >
      <Heart
        className={cn(
          'h-4 w-4 transition-colors',
          liked && 'fill-coral-500 text-coral-500'
        )}
      />
      {count > 0 && <span className="text-xs">{count}</span>}
    </Button>
  );
};
