import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui';
import { cn } from '@/lib/utils';
import { usePostLikers, useDiaryEntryLikers } from '@/api/post';

interface LikeButtonProps {
  liked: boolean;
  count: number;
  onLike: () => void;
  onUnlike: () => void;
  disabled?: boolean;
  postId?: string;
  diaryEntryId?: string;
}

export const LikeButton = ({
  liked,
  count,
  onLike,
  onUnlike,
  disabled,
  postId,
  diaryEntryId,
}: LikeButtonProps) => {
  const [hovered, setHovered] = useState(false);
  const shouldFetch = hovered && count > 0;

  const postLikers = usePostLikers(postId ?? '', shouldFetch && !!postId);
  const diaryLikers = useDiaryEntryLikers(diaryEntryId ?? '', shouldFetch && !!diaryEntryId);

  const likers = postId ? postLikers.data : diaryLikers.data;

  const tooltipContent =
    likers && likers.length > 0 ? likers.map((l) => l.name).join(', ') : undefined;

  const button = (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5 text-muted-foreground hover:text-coral-500"
      onClick={liked ? onUnlike : onLike}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Heart
        className={cn('h-4 w-4 transition-colors', liked && 'fill-coral-500 text-coral-500')}
      />
      {count > 0 && <span className="text-xs">{count}</span>}
    </Button>
  );

  if (count === 0) return button;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>{tooltipContent ?? 'Loading...'}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
