import { ShoppingBag, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Skeleton } from '@/components/ui';
import { trpc } from '@/lib/trpc';

interface ProfileProductsProps {
  trainerId: string;
  shopUrl: string;
}

const formatPrice = (pence: number) => `£${(pence / 100).toFixed(2)}`;

export const ProfileProducts = ({ trainerId, shopUrl }: ProfileProductsProps) => {
  const { data: products, isLoading } = trpc.product.getPublicProducts.useQuery(
    { trainerId },
    { enabled: !!trainerId }
  );

  const displayed = (products ?? []).slice(0, 4);

  if (!isLoading && displayed.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-light uppercase tracking-wider">
            <ShoppingBag className="h-5 w-5" />
            Shop
          </CardTitle>
          {shopUrl && (
            <Button asChild variant="ghost" size="sm">
              <a href={shopUrl} target="_blank" rel="noopener noreferrer">
                View all
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square w-full rounded-md" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {displayed.map((product) => (
              <a
                key={product.id}
                href={`${shopUrl}/${product.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-md overflow-hidden transition-colors hover:bg-muted"
              >
                <div className="aspect-square overflow-hidden rounded-md bg-muted">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-2">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};
