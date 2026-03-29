import { useState, useCallback, useEffect } from 'react';
import { Skeleton } from '@/components/ui';
import { usePublicWebsite } from '@/api/website';
import { trpc } from '@/lib/trpc';
import { SiteThemeProvider } from './components/ThemeProvider';
import { SiteLayout } from './components/SiteLayout';
import { SectionRenderer } from './components/sections';
import { BlogListPage, BlogPostPage } from './components/blog';

type SiteView = { page: 'home' } | { page: 'blog' } | { page: 'blog-post'; slug: string };

const parsePathToView = (): SiteView => {
  const path = window.location.pathname;
  if (path === '/blog' || path === '/blog/') return { page: 'blog' };
  const postMatch = path.match(/^\/blog\/(.+)$/);
  if (postMatch?.[1]) return { page: 'blog-post', slug: postMatch[1] };
  return { page: 'home' };
};

interface SiteRendererProps {
  handle: string;
}

export const SiteRenderer = ({ handle }: SiteRendererProps) => {
  const { data: website, isLoading, isError, error } = usePublicWebsite(handle);
  const [view, setView] = useState<SiteView>(parsePathToView);

  // Check if blog posts exist for dynamic nav item (must be before early returns)
  const subdomain = website?.subdomain ?? '';
  const { data: blogData } = trpc.blog.getPublicPosts.useQuery(
    { subdomain, limit: 1 },
    { enabled: !!subdomain }
  );
  const hasBlogPosts = (blogData?.posts?.length ?? 0) > 0;

  // Handle browser back/forward
  useEffect(() => {
    const onPopState = () => setView(parsePathToView());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((newView: SiteView, path: string) => {
    window.history.pushState(null, '', path);
    setView(newView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNavigateBlog = useCallback(() => {
    navigate({ page: 'blog' }, '/blog');
  }, [navigate]);

  const handleNavigatePost = useCallback((slug: string) => {
    navigate({ page: 'blog-post', slug }, `/blog/${slug}`);
  }, [navigate]);

  const handleNavigateHome = useCallback(() => {
    navigate({ page: 'home' }, '/');
  }, [navigate]);

  // Update document title based on site SEO
  if (website?.seoTitle) {
    document.title = website.seoTitle;
  }

  // Set favicon
  if (website?.faviconUrl) {
    const existing = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
    if (existing) {
      existing.href = website.faviconUrl;
    } else {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = website.faviconUrl;
      document.head.appendChild(link);
    }
  }

  // Set meta description
  if (website?.seoDescription) {
    const existing = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (existing) {
      existing.content = website.seoDescription;
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = website.seoDescription;
      document.head.appendChild(meta);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header skeleton */}
        <div className="border-b bg-white px-4 py-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
        {/* Hero skeleton */}
        <Skeleton className="h-[60vh] w-full" />
        {/* Content skeleton */}
        <div className="mx-auto max-w-7xl space-y-8 px-4 py-12">
          <Skeleton className="mx-auto h-8 w-64" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !website) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Site not found</h1>
          <p className="mt-2 text-gray-500">
            {error?.message ?? 'This website could not be loaded.'}
          </p>
          <a
            href="https://fitnassist.co"
            className="mt-4 inline-block text-sm text-blue-600 hover:underline"
          >
            Go to Fitnassist
          </a>
        </div>
      </div>
    );
  }

  const sortedSections = [...website.sections]
    .filter((s) => s.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <SiteThemeProvider website={website}>
      <SiteLayout website={website} onNavigateBlog={handleNavigateBlog} onNavigateHome={handleNavigateHome} hasBlogPosts={hasBlogPosts}>
        {view.page === 'home' && (
          <>
            {sortedSections.map((section) => (
              <SectionRenderer
                key={section.id}
                section={section}
                trainer={website.trainer}
                subdomain={website.subdomain}
                onNavigateBlog={handleNavigateBlog}
                onNavigatePost={handleNavigatePost}
              />
            ))}
          </>
        )}

        {view.page === 'blog' && (
          <BlogListPage
            subdomain={website.subdomain}
            onNavigatePost={handleNavigatePost}
            onNavigateHome={handleNavigateHome}
          />
        )}

        {view.page === 'blog-post' && (
          <BlogPostPage
            subdomain={website.subdomain}
            slug={view.slug}
            onNavigateBack={handleNavigateBlog}
          />
        )}
      </SiteLayout>
    </SiteThemeProvider>
  );
};
