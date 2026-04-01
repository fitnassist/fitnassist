import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui';

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  shortDescription: string | null;
  pricePence: number;
  compareAtPricePence: number | null;
  onNavigate: (slug: string) => void;
  onAddToCart?: (productId: string) => void;
}

export const ProductCard = ({
  id,
  name,
  slug,
  imageUrl,
  shortDescription,
  pricePence,
  compareAtPricePence,
  onNavigate,
  onAddToCart,
}: ProductCardProps) => {
  return (
    <div className="group rounded-lg overflow-hidden border border-[hsl(var(--border))] bg-[hsl(var(--card))] transition-shadow hover:shadow-lg">
      <button onClick={() => onNavigate(slug)} className="w-full text-left">
        <div className="aspect-square bg-[hsl(var(--muted))] overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">No image</span>
            </div>
          )}
        </div>
        <div className="p-4 pb-2">
          <h3 className="font-medium text-[hsl(var(--foreground))] line-clamp-2">{name}</h3>
          {shortDescription && (
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))] line-clamp-2">
              {shortDescription}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-lg font-semibold text-[hsl(var(--foreground))]">
              £{(pricePence / 100).toFixed(2)}
            </span>
            {compareAtPricePence && (
              <span className="text-sm text-[hsl(var(--muted-foreground))] line-through">
                £{(compareAtPricePence / 100).toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </button>
      {onAddToCart && (
        <div className="px-4 pb-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full border-[hsl(var(--border))] text-[hsl(var(--foreground))]"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(id);
            }}
          >
            <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
            Add to cart
          </Button>
        </div>
      )}
    </div>
  );
};
