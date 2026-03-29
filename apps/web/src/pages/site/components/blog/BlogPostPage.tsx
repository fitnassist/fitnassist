import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import { Button, Skeleton } from '@/components/ui';
import { trpc } from '@/lib/trpc';

interface BlogPostPageProps {
  subdomain: string;
  slug: string;
  onNavigateBack: () => void;
}

export const BlogPostPage = ({ subdomain, slug, onNavigateBack }: BlogPostPageProps) => {
  const { data: post, isLoading, isError } = trpc.blog.getPublicPost.useQuery(
    { subdomain, slug },
    { enabled: !!subdomain && !!slug }
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <Skeleton className="mb-4 h-8 w-3/4" />
        <Skeleton className="mb-8 h-4 w-1/3" />
        <Skeleton className="mb-4 aspect-video w-full rounded-lg" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 lg:px-8">
        <p className="text-[hsl(var(--muted-foreground))]">Blog post not found.</p>
        <Button variant="ghost" className="mt-4" onClick={onNavigateBack}>
          Back to blog
        </Button>
      </div>
    );
  }

  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const tags = post.tags ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Button variant="ghost" className="mb-6" onClick={onNavigateBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to blog
      </Button>

      <article>
        <h1 className="site-heading text-3xl font-bold text-[hsl(var(--foreground))] sm:text-4xl">
          {post.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          {publishedDate && (
            <div className="flex items-center gap-1 text-sm text-[hsl(var(--muted-foreground))]">
              <Calendar className="h-4 w-4" />
              <span>{publishedDate}</span>
            </div>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Tag className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 text-xs text-[hsl(var(--muted-foreground))]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {post.coverImageUrl && (
          <div className="mt-8 overflow-hidden rounded-lg">
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="w-full object-cover"
            />
          </div>
        )}

        <div
          className="prose mt-8 max-w-none text-[hsl(var(--foreground))]"
          dangerouslySetInnerHTML={{ __html: post.content ?? '' }}
        />
      </article>
    </div>
  );
};
