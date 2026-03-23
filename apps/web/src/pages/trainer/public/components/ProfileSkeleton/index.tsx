import { Card, CardContent, CardHeader } from '@/components/ui';

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen animate-pulse">
      {/* Cover Image Skeleton */}
      <div className="h-48 sm:h-64 lg:h-80 w-full bg-muted" />

      {/* Profile Info Skeleton */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 sm:-mt-24 flex flex-col sm:flex-row sm:items-end sm:gap-6 pb-6">
          {/* Profile Image Skeleton */}
          <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-muted border-4 border-background" />

          {/* Name Skeleton */}
          <div className="mt-4 sm:mt-0 sm:pb-4 space-y-2">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded" />
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <div className="h-6 w-24 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted rounded" />
                  <div className="h-4 w-full bg-muted rounded" />
                  <div className="h-4 w-3/4 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-6 w-24 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-8 w-24 bg-muted rounded-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="h-6 w-24 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-40 bg-muted rounded" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
