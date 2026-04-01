import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const SIZE_MAP = {
  sm: { star: 'h-3.5 w-3.5', text: 'text-xs', gap: 'gap-0.5' },
  md: { star: 'h-5 w-5', text: 'text-sm', gap: 'gap-0.5' },
  lg: { star: 'h-6 w-6', text: 'text-base', gap: 'gap-1' },
} as const;

interface StarRatingDisplayProps {
  rating: number;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StarRating = ({ rating, count, size = 'md', className }: StarRatingDisplayProps) => {
  const { star, text, gap } = SIZE_MAP[size];

  return (
    <div className={cn('flex items-center', gap, className)}>
      <div className={cn('flex items-center', gap)}>
        {[1, 2, 3, 4, 5].map((value) => {
          const fill = Math.min(Math.max(rating - (value - 1), 0), 1);
          return (
            <span key={value} className="relative">
              <Star className={cn(star, 'text-muted-foreground/30')} />
              {fill > 0 && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <Star className={cn(star, 'text-yellow-500 fill-yellow-500')} />
                </span>
              )}
            </span>
          );
        })}
      </div>
      {count !== undefined && (
        <span className={cn(text, 'text-muted-foreground ml-1')}>({count})</span>
      )}
    </div>
  );
};

interface InteractiveStarRatingProps {
  value: number;
  onChange: (value: number) => void;
  size?: 'md' | 'lg';
  className?: string;
}

export const InteractiveStarRating = ({
  value,
  onChange,
  size = 'lg',
  className,
}: InteractiveStarRatingProps) => {
  const [hoverValue, setHoverValue] = useState(0);
  const { star, gap } = SIZE_MAP[size];
  const displayValue = hoverValue || value;

  return (
    <div className={cn('flex items-center', gap, className)} onMouseLeave={() => setHoverValue(0)}>
      {[1, 2, 3, 4, 5].map((starValue) => (
        <button
          key={starValue}
          type="button"
          className="focus:outline-none transition-transform hover:scale-110"
          onClick={() => onChange(starValue)}
          onMouseEnter={() => setHoverValue(starValue)}
        >
          <Star
            className={cn(
              star,
              starValue <= displayValue
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-muted-foreground/30',
            )}
          />
        </button>
      ))}
    </div>
  );
};
