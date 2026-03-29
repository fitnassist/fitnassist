import { ArrowRight } from 'lucide-react';
import { Button, Skeleton } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { BlogCard } from '../blog/BlogCard';
import type { PublicSection } from '../../site.types';

interface BlogSectionProps {
  section: PublicSection;
  subdomain?: string;
  onNavigateBlog?: () => void;
  onNavigatePost?: (slug: string) => void;
}

export const BlogSection = ({ section, subdomain, onNavigateBlog, onNavigatePost }: BlogSectionProps) => {
  const { data, isLoading } = trpc.blog.getPublicPosts.useQuery(
    { subdomain: subdomain ?? '', limit: 3 },
    { enabled: !!subdomain }
  );

  const posts = data?.posts ?? [];

  if (!subdomain || (!isLoading && posts.length === 0)) return null;

  return (
    <section id={`section-${section.id}`} className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {section.title && (
          <h2 className="site-heading mb-4 text-center text-3xl font-bold text-[hsl(var(--foreground))]">
            {section.title}
          </h2>
        )}
        {section.subtitle && (
          <p className="mb-10 text-center text-lg text-[hsl(var(--muted-foreground))]">
            {section.subtitle}
          </p>
        )}

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video w-full rounded-lg" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
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
                  publishedAt={post.publishedAt ? String(post.publishedAt) : null}
                  tags={post.tags ?? []}
                  onNavigate={onNavigatePost ?? (() => {})}
                />
              ))}
            </div>
            {onNavigateBlog && (
              <div className="mt-8 text-center">
                <Button
                  variant="outline"
                  onClick={onNavigateBlog}
                  className="border-[hsl(var(--border))] text-[hsl(var(--foreground))]"
                >
                  View all posts
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
