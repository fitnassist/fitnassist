import { cn } from '@/lib/utils';
import { Card, CardContent } from './card';

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse rounded bg-muted', className)} />
);

export const SkeletonAvatar = ({ className }: { className?: string }) => (
  <Skeleton className={cn('h-10 w-10 rounded-full', className)} />
);

export const SkeletonText = ({ className }: { className?: string }) => (
  <Skeleton className={cn('h-4 w-full', className)} />
);

export const SkeletonCard = (_props?: { lines?: number }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center gap-4">
        <SkeletonAvatar className="h-12 w-12" />
        <div className="flex-1 space-y-2">
          <SkeletonText className="w-1/3" />
          <SkeletonText className="w-1/2" />
        </div>
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
    </CardContent>
  </Card>
);

export const SkeletonHeader = () => (
  <div className="space-y-2">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-4 w-72" />
  </div>
);

export const SkeletonTabs = ({ count = 3 }: { count?: number }) => (
  <div className="flex gap-2">
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} className="h-10 w-28 rounded-md" />
    ))}
  </div>
);

export const SkeletonCardList = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonConversationRow = () => (
  <div className="p-4 flex items-center gap-3 border-b">
    <SkeletonAvatar />
    <div className="flex-1 space-y-2">
      <SkeletonText className="w-1/3" />
      <SkeletonText className="w-2/3" />
    </div>
  </div>
);
