import { ArrowLeft, ShoppingBag, ShoppingCart } from 'lucide-react';
import { Button, Skeleton } from '@/components/ui';
import { trpc } from '@/lib/trpc';

interface ProductDetailPageProps {
  trainerId: string;
  slug: string;
  onNavigateBack: () => void;
  onBuyNow?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
}

export const ProductDetailPage = ({
  trainerId,
  slug,
  onNavigateBack,
  onBuyNow,
  onAddToCart,
}: ProductDetailPageProps) => {
  const { data: product, isLoading } = trpc.product.getPublicProduct.useQuery(
    { trainerId, slug },
    { enabled: !!trainerId && !!slug },
  );

  if (isLoading) {
    return (
      <div className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Skeleton className="mb-6 h-5 w-24" />
          <div className="grid gap-8 lg:grid-cols-2">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-12 w-48" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Product not found</h1>
          <p className="mt-2 text-[hsl(var(--muted-foreground))]">
            This product may no longer be available.
          </p>
          <Button variant="outline" onClick={onNavigateBack} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to shop
          </Button>
        </div>
      </div>
    );
  }

  const hasDiscount =
    product.compareAtPricePence && product.compareAtPricePence > product.pricePence;

  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <button
            onClick={onNavigateBack}
            className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            Shop
          </button>
          <span className="mx-2 text-[hsl(var(--muted-foreground))]">/</span>
          <span className="text-[hsl(var(--foreground))]">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image */}
          <div className="aspect-square overflow-hidden rounded-lg bg-[hsl(var(--muted))]">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">No image</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <h1 className="site-heading text-2xl font-bold text-[hsl(var(--foreground))] sm:text-3xl">
              {product.name}
            </h1>

            {product.shortDescription && (
              <p className="mt-2 text-lg text-[hsl(var(--muted-foreground))]">
                {product.shortDescription}
              </p>
            )}

            {/* Price */}
            <div className="mt-4 flex items-center gap-3">
              <span className="text-2xl font-bold text-[hsl(var(--foreground))]">
                £{(product.pricePence / 100).toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-lg text-[hsl(var(--muted-foreground))] line-through">
                  £{(product.compareAtPricePence! / 100).toFixed(2)}
                </span>
              )}
            </div>

            {/* Product type badge */}
            <div className="mt-3">
              <span className="inline-flex items-center rounded-full bg-[hsl(var(--muted))] px-2.5 py-0.5 text-xs font-medium text-[hsl(var(--muted-foreground))]">
                {product.type === 'DIGITAL' ? 'Digital download' : 'Physical product'}
              </span>
            </div>

            {/* Action buttons */}
            {(onBuyNow || onAddToCart) && (
              <div className="mt-6 flex flex-wrap gap-3">
                {onAddToCart && (
                  <Button
                    onClick={() => onAddToCart(product.id)}
                    variant="outline"
                    size="lg"
                    className="border-[hsl(var(--border))] text-[hsl(var(--foreground))]"
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Add to cart
                  </Button>
                )}
                {onBuyNow && (
                  <Button onClick={() => onBuyNow(product.id)} size="lg">
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Buy now — £{(product.pricePence / 100).toFixed(2)}
                  </Button>
                )}
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="mt-8 border-t border-[hsl(var(--border))] pt-6">
                <h2 className="mb-3 text-lg font-semibold text-[hsl(var(--foreground))]">
                  Description
                </h2>
                <div
                  className="prose prose-sm max-w-none text-[hsl(var(--muted-foreground))] [&_a]:text-[hsl(var(--primary))] [&_h2]:text-[hsl(var(--foreground))] [&_h3]:text-[hsl(var(--foreground))] [&_strong]:text-[hsl(var(--foreground))]"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Image gallery */}
        {product.galleryUrls && product.galleryUrls.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-[hsl(var(--foreground))]">Gallery</h2>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {product.galleryUrls.map((url, i) => (
                <div
                  key={i}
                  className="aspect-square overflow-hidden rounded-lg bg-[hsl(var(--muted))]"
                >
                  <img
                    src={url}
                    alt={`${product.name} - Image ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
