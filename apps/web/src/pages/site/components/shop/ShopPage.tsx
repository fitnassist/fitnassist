import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input, Skeleton } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { ProductCard } from './ProductCard';

interface ShopPageProps {
  trainerId: string;
  onNavigateProduct: (slug: string) => void;
  onNavigateHome: () => void;
  onAddToCart?: (productId: string) => void;
}

export const ShopPage = ({
  trainerId,
  onNavigateProduct,
  onNavigateHome,
  onAddToCart,
}: ShopPageProps) => {
  const { data: products, isLoading } = trpc.product.getPublicProducts.useQuery({ trainerId });
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'default' | 'price-asc' | 'price-desc'>('default');

  const filtered = useMemo(() => {
    if (!products) return [];
    let result = [...products];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) || (p.shortDescription ?? '').toLowerCase().includes(q),
      );
    }
    if (sort === 'price-asc') result.sort((a, b) => a.pricePence - b.pricePence);
    if (sort === 'price-desc') result.sort((a, b) => b.pricePence - a.pricePence);
    return result;
  }, [products, search, sort]);

  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <button
            onClick={onNavigateHome}
            className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            Home
          </button>
          <span className="mx-2 text-[hsl(var(--muted-foreground))]">/</span>
          <span className="text-[hsl(var(--foreground))]">Shop</span>
        </nav>

        <h1 className="site-heading text-3xl font-bold text-[hsl(var(--foreground))] mb-8">Shop</h1>

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="pl-10 bg-[hsl(var(--background))] border-[hsl(var(--border))]"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
          >
            <option value="default">Default</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[hsl(var(--muted-foreground))]">
              {search ? 'No products match your search.' : 'No products available yet.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                slug={product.slug}
                imageUrl={product.imageUrl}
                shortDescription={product.shortDescription}
                pricePence={product.pricePence}
                compareAtPricePence={product.compareAtPricePence}
                onNavigate={onNavigateProduct}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
