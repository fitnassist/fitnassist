import { useState } from 'react';
import { ArrowLeft, ArrowRight, Search, X } from 'lucide-react';
import { Button, Input, Skeleton } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { BlogCard } from './BlogCard';

interface BlogListPageProps {
  subdomain: string;
  onNavigatePost: (slug: string) => void;
  onNavigateHome: () => void;
}

export const BlogListPage = ({ subdomain, onNavigatePost, onNavigateHome }: BlogListPageProps) => {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | undefined>(undefined);

  const { data: tags } = trpc.blog.getPublicTags.useQuery(
    { subdomain },
    { enabled: !!subdomain }
  );

  const { data, isLoading, isError } = trpc.blog.getPublicPosts.useQuery(
    { subdomain, cursor, limit: 12, search: activeSearch || undefined, tag: activeTag },
    { enabled: !!subdomain }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(search);
    setCursor(undefined);
  };

  const clearSearch = () => {
    setSearch('');
    setActiveSearch('');
    setCursor(undefined);
  };

  const handleTagClick = (tag: string) => {
    setActiveTag(activeTag === tag ? undefined : tag);
    setCursor(undefined);
  };

  const hasFilters = !!activeSearch || !!activeTag;

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

      {/* Search and filters */}
      <div className="mb-8 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts..."
              className="pl-9 border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"
            />
            {search && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button type="submit" className="shrink-0">
            Search
          </Button>
        </form>

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`rounded-full px-3 py-1 text-sm transition-colors ${
                  activeTag === tag
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                    : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/80'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {hasFilters && (
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
            <span>
              {activeSearch && `Searching "${activeSearch}"`}
              {activeSearch && activeTag && ' in '}
              {activeTag && `Tag: ${activeTag}`}
            </span>
            <button
              onClick={() => {
                clearSearch();
                setActiveTag(undefined);
              }}
              className="text-[hsl(var(--primary))] hover:underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
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
      ) : isError ? (
        <div className="py-12 text-center">
          <p className="text-[hsl(var(--muted-foreground))]">Failed to load blog posts.</p>
          <Button variant="ghost" className="mt-4" onClick={onNavigateHome}>
            Back to home
          </Button>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-[hsl(var(--muted-foreground))]">
            {hasFilters ? 'No posts match your search.' : 'No blog posts yet.'}
          </p>
          {hasFilters && (
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => {
                clearSearch();
                setActiveTag(undefined);
              }}
            >
              Clear filters
            </Button>
          )}
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
                onNavigate={onNavigatePost}
              />
            ))}
          </div>

          {(cursor || nextCursor) && (
            <div className="mt-8 flex justify-center gap-4">
              {cursor && (
                <Button
                  variant="outline"
                  onClick={() => setCursor(undefined)}
                  className="border-[hsl(var(--border))] text-[hsl(var(--foreground))]"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  First page
                </Button>
              )}
              {nextCursor && (
                <Button
                  variant="outline"
                  onClick={() => setCursor(nextCursor)}
                  className="border-[hsl(var(--border))] text-[hsl(var(--foreground))]"
                >
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
