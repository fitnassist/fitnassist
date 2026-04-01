import { ShoppingCart, X, Trash2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui';

export interface CartItem {
  id: string;
  name: string;
  pricePence: number;
  type: 'DIGITAL' | 'PHYSICAL';
  imageUrl: string | null;
  quantity: number;
}

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  onClearCart: () => void;
}

const formatPrice = (pence: number) => `£${(pence / 100).toFixed(2)}`;

export const CartDrawer = ({
  open,
  onOpenChange,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onClearCart,
}: CartDrawerProps) => {
  const totalPence = items.reduce((sum, item) => sum + item.pricePence * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50" onClick={() => onOpenChange(false)} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-[hsl(var(--background))] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-4 py-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-[hsl(var(--foreground))]" />
            <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
              Cart ({totalItems})
            </h2>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="mb-3 h-12 w-12 text-[hsl(var(--muted-foreground))]" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 rounded-lg border border-[hsl(var(--border))] p-3"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-16 w-16 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--muted))]">
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">No img</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">
                      {item.name}
                    </p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      {formatPrice(item.pricePence)}
                    </p>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          disabled={item.quantity <= 1}
                          className="flex h-7 w-7 items-center justify-center rounded border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] disabled:opacity-50"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium text-[hsl(var(--foreground))]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                          {formatPrice(item.pricePence * item.quantity)}
                        </span>
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="rounded p-1 text-[hsl(var(--muted-foreground))] hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[hsl(var(--border))] p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[hsl(var(--muted-foreground))]">Subtotal</span>
              <span className="text-lg font-semibold text-[hsl(var(--foreground))]">
                {formatPrice(totalPence)}
              </span>
            </div>
            <Button onClick={onCheckout} className="w-full" size="lg">
              Checkout ({totalItems} {totalItems === 1 ? 'item' : 'items'})
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearCart}
              className="w-full text-[hsl(var(--muted-foreground))]"
            >
              Clear cart
            </Button>
          </div>
        )}
      </div>
    </>
  );
};
