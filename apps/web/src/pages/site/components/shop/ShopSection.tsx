import { ArrowRight } from 'lucide-react';
import { Button, Skeleton } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { ProductCard } from './ProductCard';
import type { PublicSection } from '../../site.types';

interface ShopSectionProps {
  section: PublicSection;
  trainerId?: string;
  onNavigateShop?: () => void;
  onNavigateProduct?: (slug: string) => void;
  onAddToCart?: (productId: string) => void;
}

export const ShopSection = ({ section, trainerId, onNavigateShop, onNavigateProduct, onAddToCart }: ShopSectionProps) => {
  const { data: products, isLoading } = trpc.product.getPublicProducts.useQuery(
    { trainerId: trainerId ?? '' },
    { enabled: !!trainerId }
  );

  const displayed = (products ?? []).slice(0, 6);

  if (!trainerId || (!isLoading && displayed.length === 0)) return null;

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
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayed.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  slug={product.slug}
                  imageUrl={product.imageUrl}
                  shortDescription={product.shortDescription}
                  pricePence={product.pricePence}
                  compareAtPricePence={product.compareAtPricePence}
                  onNavigate={onNavigateProduct ?? (() => {})}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
            {onNavigateShop && (
              <div className="mt-8 text-center">
                <Button
                  variant="outline"
                  onClick={onNavigateShop}
                  className="border-[hsl(var(--border))] text-[hsl(var(--foreground))]"
                >
                  Browse all products
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
