import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button, Skeleton } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { BlogCard } from './BlogCard';

interface BlogListPageProps {
  subdomain: string;
  onNavigatePost: (slug: string) => void;
  onNavigateHome: () => void;
}

export const BlogListPage = ({ subdomain, onNavigatePost, onNavigateHome }: BlogListPageProps) => {
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const { data, isLoading, isError } = trpc.blog.getPublicPosts.useQuery(
    { subdomain, cursor, limit: 12 },
    { enabled: !!subdomain }
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Skeleton className="mb-8 h-10 w-48" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-video w-full rounded-lg" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 lg:px-8">
        <p className="text-[hsl(var(--muted-foreground))]">Failed to load blog posts.</p>
        <Button variant="ghost" className="mt-4" onClick={onNavigateHome}>
          Back to home
        </Button>
      </div>
    );
  }

  const posts = data?.posts ?? [];
  const nextCursor = data?.nextCursor;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onNavigateHome}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="site-heading text-3xl font-bold text-[hsl(var(--foreground))]">Blog</h1>
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-[hsl(var(--muted-foreground))]">No blog posts yet.</p>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogCard
                key={post.id}
                title={post.title}
                slug={post.slug}
                excerpt={post.excerpt}
                coverImageUrl={post.coverImageUrl}
                publishedAt={post.publishedAt ? post.publishedAt.toISOString() : null}
                tags={post.tags ?? []}
                onNavigate={onNavigatePost}
              />
            ))}
          </div>

          {(cursor || nextCursor) && (
            <div className="mt-8 flex justify-center gap-4">
              {cursor && (
                <Button variant="outline" onClick={() => setCursor(undefined)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  First page
                </Button>
              )}
              {nextCursor && (
                <Button variant="outline" onClick={() => setCursor(nextCursor)}>
                  Next page
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
