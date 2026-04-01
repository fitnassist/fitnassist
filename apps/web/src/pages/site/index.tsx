import { useState, useCallback, useEffect } from 'react';
import { Skeleton } from '@/components/ui';
import { usePublicWebsite } from '@/api/website';
import { trpc } from '@/lib/trpc';
import { SiteThemeProvider } from './components/ThemeProvider';
import { SiteLayout } from './components/SiteLayout';
import { SectionRenderer } from './components/sections';
import { BlogListPage, BlogPostPage } from './components/blog';
import { ShopPage, ProductDetailPage, CheckoutDialog, CartDrawer } from './components/shop';
import type { CartItem } from './components/shop';

type SiteView =
  | { page: 'home' }
  | { page: 'blog' }
  | { page: 'blog-post'; slug: string }
  | { page: 'shop' }
  | { page: 'shop-product'; slug: string };

const parsePathToView = (): SiteView => {
  const path = window.location.pathname;
  if (path === '/blog' || path === '/blog/') return { page: 'blog' };
  const postMatch = path.match(/^\/blog\/(.+)$/);
  if (postMatch?.[1]) return { page: 'blog-post', slug: postMatch[1] };
  if (path === '/shop' || path === '/shop/') return { page: 'shop' };
  const productMatch = path.match(/^\/shop\/(.+)$/);
  if (productMatch?.[1]) return { page: 'shop-product', slug: productMatch[1] };
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
  const trainerId = website?.trainer?.id ?? '';
  const { data: blogData } = trpc.blog.getPublicPosts.useQuery(
    { subdomain, limit: 1 },
    { enabled: !!subdomain },
  );
  const hasBlogPosts = (blogData?.posts?.length ?? 0) > 0;

  // Check if products exist for dynamic nav item
  const { data: productsData } = trpc.product.getPublicProducts.useQuery(
    { trainerId },
    { enabled: !!trainerId },
  );
  const hasProducts = (productsData?.length ?? 0) > 0;

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = useCallback(
    (productId: string) => {
      const product = productsData?.find((p) => p.id === productId);
      if (!product) return;

      setCartItems((prev) => {
        const existing = prev.find((item) => item.id === productId);
        if (existing) {
          return prev.map((item) =>
            item.id === productId ? { ...item, quantity: item.quantity + 1 } : item,
          );
        }
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            pricePence: product.pricePence,
            type: product.type as 'DIGITAL' | 'PHYSICAL',
            imageUrl: product.imageUrl,
            quantity: 1,
          },
        ];
      });
      setCartOpen(true);
    },
    [productsData],
  );

  const handleUpdateCartQuantity = useCallback((productId: string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity } : item)),
    );
  }, []);

  const handleRemoveCartItem = useCallback((productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const handleClearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const handleCartCheckout = useCallback(() => {
    setCartOpen(false);
    setCheckoutOpen(true);
  }, []);

  const handleBuyNow = useCallback(
    (productId: string) => {
      const product = productsData?.find((p) => p.id === productId);
      if (!product) return;

      // Set cart to just this product and open checkout directly
      setCartItems([
        {
          id: product.id,
          name: product.name,
          pricePence: product.pricePence,
          type: product.type as 'DIGITAL' | 'PHYSICAL',
          imageUrl: product.imageUrl,
          quantity: 1,
        },
      ]);
      setCheckoutOpen(true);
    },
    [productsData],
  );

  const handleCheckoutSuccess = useCallback(() => {
    setCartItems([]);
  }, []);

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

  const handleNavigatePost = useCallback(
    (slug: string) => {
      navigate({ page: 'blog-post', slug }, `/blog/${slug}`);
    },
    [navigate],
  );

  const handleNavigateShop = useCallback(() => {
    navigate({ page: 'shop' }, '/shop');
  }, [navigate]);

  const handleNavigateProduct = useCallback(
    (slug: string) => {
      navigate({ page: 'shop-product', slug }, `/shop/${slug}`);
    },
    [navigate],
  );

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
      <SiteLayout
        website={website}
        onNavigateBlog={handleNavigateBlog}
        onNavigateHome={handleNavigateHome}
        onNavigateShop={handleNavigateShop}
        onOpenCart={() => setCartOpen(true)}
        cartItemCount={cartItemCount}
        hasBlogPosts={hasBlogPosts}
        hasProducts={hasProducts}
        isHomePage={view.page === 'home'}
      >
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
                onNavigateShop={handleNavigateShop}
                onNavigateProduct={handleNavigateProduct}
                onAddToCart={handleAddToCart}
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

        {view.page === 'shop' && (
          <ShopPage
            trainerId={trainerId}
            onNavigateProduct={handleNavigateProduct}
            onNavigateHome={handleNavigateHome}
            onAddToCart={handleAddToCart}
          />
        )}

        {view.page === 'shop-product' && (
          <ProductDetailPage
            trainerId={trainerId}
            slug={view.slug}
            onNavigateBack={handleNavigateShop}
            onBuyNow={handleBuyNow}
            onAddToCart={handleAddToCart}
          />
        )}

        <CartDrawer
          open={cartOpen}
          onOpenChange={setCartOpen}
          items={cartItems}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveCartItem}
          onCheckout={handleCartCheckout}
          onClearCart={handleClearCart}
        />

        {checkoutOpen && cartItems.length > 0 && (
          <CheckoutDialog
            open={checkoutOpen}
            onOpenChange={setCheckoutOpen}
            items={cartItems}
            trainerId={trainerId}
            onSuccess={handleCheckoutSuccess}
          />
        )}
      </SiteLayout>
    </SiteThemeProvider>
  );
};
