import { ShoppingBag, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Skeleton } from '@/components/ui';
import { trpc } from '@/lib/trpc';

interface ProfileProductsProps {
  trainerId: string;
  shopUrl: string;
}

const formatPrice = (pence: number) => `£${(pence / 100).toFixed(2)}`;

export const ProfileProducts = ({ trainerId, shopUrl }: ProfileProductsProps) => {
  const { data: products, isLoading } = trpc.product.getTopSelling.useQuery(
    { trainerId, limit: 3 },
    { enabled: !!trainerId },
  );

  if (!isLoading && (!products || products.length === 0)) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-light uppercase tracking-wider">
          <ShoppingBag className="h-5 w-5" />
          Top Products
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-16 w-16 shrink-0 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {products?.map((product) => (
              <a
                key={product.id}
                href={`${shopUrl}/${product.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-4 rounded-md p-2 transition-colors hover:bg-muted"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium line-clamp-2">{product.name}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm font-semibold">{formatPrice(product.pricePence)}</span>
                    {product.compareAtPricePence && (
                      <span className="text-xs text-muted-foreground line-through">
                        {formatPrice(product.compareAtPricePence)}
                      </span>
                    )}
                  </div>
                </div>
              </a>
            ))}

            <div className="pt-2">
              <Button asChild variant="outline" size="sm">
                <a href={shopUrl} target="_blank" rel="noopener noreferrer">
                  Visit Shop
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
