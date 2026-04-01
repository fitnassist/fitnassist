import { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ShoppingBag, Loader2, CheckCircle, LogIn } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, Button, Input } from '@/components/ui';
import { stripePromise } from '@/lib/stripe';
import { useSession } from '@/lib/auth-client';
import { trpc } from '@/lib/trpc';
import { CouponInput } from './CouponInput';
import type { CartItem } from './CartDrawer';

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  trainerId: string;
  onSuccess?: () => void;
}

const formatPrice = (pence: number) => `£${(pence / 100).toFixed(2)}`;

type CheckoutState =
  | { step: 'details' }
  | { step: 'payment'; clientSecret: string; orderId: string }
  | { step: 'success'; orderId: string; hasDigital: boolean };

const PaymentForm = ({
  totalPence,
  onSuccess,
  isProcessing,
  setIsProcessing,
}: {
  totalPence: number;
  onSuccess: () => void;
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? 'Payment failed');
      setIsProcessing(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed');
      setIsProcessing(false);
      return;
    }

    onSuccess();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[hsl(var(--border))] p-4">
        <PaymentElement />
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</div>}

      <Button
        onClick={handleSubmit}
        disabled={!stripe || isProcessing}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay ${formatPrice(totalPence)}`
        )}
      </Button>
    </div>
  );
};

export const CheckoutDialog = ({
  open,
  onOpenChange,
  items,
  trainerId,
  onSuccess,
}: CheckoutDialogProps) => {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  const [state, setState] = useState<CheckoutState>({ step: 'details' });
  const [coupon, setCoupon] = useState<{
    code: string;
    discountPence: number;
    percentOff: number | null;
    amountOffPence: number | null;
  } | null>(null);
  const [shippingName, setShippingName] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const createOrder = trpc.order.create.useMutation();

  const subtotalPence = items.reduce((sum, item) => sum + item.pricePence * item.quantity, 0);
  const discountPence = coupon?.discountPence ?? 0;
  const totalPence = Math.max(subtotalPence - discountPence, 1);
  const hasPhysical = items.some((item) => item.type === 'PHYSICAL');
  const hasDigital = items.some((item) => item.type === 'DIGITAL');

  const handleClose = (open: boolean) => {
    if (isProcessing) return;
    onOpenChange(open);
    if (!open) {
      setState({ step: 'details' });
      setCoupon(null);
      setShippingName('');
      setShippingAddress('');
      setCreateError(null);
      setIsCreating(false);
      setIsProcessing(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (hasPhysical && (!shippingName.trim() || !shippingAddress.trim())) {
      setCreateError('Shipping details are required for physical products');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const result = await createOrder.mutateAsync({
        trainerId,
        items: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
        couponCode: coupon?.code,
        shippingName: hasPhysical ? shippingName : undefined,
        shippingAddress: hasPhysical ? shippingAddress : undefined,
      });

      setState({
        step: 'payment',
        clientSecret: result.clientSecret,
        orderId: result.orderId,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create order';
      setCreateError(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handlePaymentSuccess = () => {
    if (state.step === 'payment') {
      setState({ step: 'success', orderId: state.orderId, hasDigital });
      onSuccess?.();
    }
  };

  // Not logged in
  if (!isLoggedIn) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in to purchase</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              You need a Fitnassist account to make purchases. It's free and takes less than a
              minute.
            </p>
            <div className="flex gap-3">
              <Button asChild variant="outline" className="flex-1">
                <a href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in
                </a>
              </Button>
              <Button asChild className="flex-1">
                <a href="/register">Create account</a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Success state
  if (state.step === 'success') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">
                Order confirmed!
              </h2>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                {state.hasDigital && !hasPhysical
                  ? 'Your downloads will be available in your purchases.'
                  : hasPhysical
                    ? 'The trainer will process your order shortly.'
                    : 'Your order has been confirmed.'}
              </p>
            </div>
            <Button onClick={() => handleClose(false)} className="w-full">
              Continue shopping
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Payment state
  if (state.step === 'payment') {
    if (!stripePromise) {
      return (
        <Dialog open={open} onOpenChange={handleClose}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Payment unavailable</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Payment processing is not configured. Please contact the trainer.
            </p>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment</DialogTitle>
          </DialogHeader>

          {/* Order summary */}
          <div className="rounded-md border border-[hsl(var(--border))] p-3 space-y-2 text-sm">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span className="text-[hsl(var(--muted-foreground))]">
                  {item.name} x{item.quantity}
                </span>
                <span className="text-[hsl(var(--foreground))]">
                  {formatPrice(item.pricePence * item.quantity)}
                </span>
              </div>
            ))}
            {discountPence > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({coupon?.code})</span>
                <span>-{formatPrice(discountPence)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-[hsl(var(--border))] pt-2 font-semibold text-[hsl(var(--foreground))]">
              <span>Total</span>
              <span>{formatPrice(totalPence)}</span>
            </div>
          </div>

          <Elements
            stripe={stripePromise}
            options={{
              clientSecret: state.clientSecret,
              appearance: {
                theme: 'stripe',
                variables: { borderRadius: '8px' },
              },
            }}
          >
            <PaymentForm
              totalPence={totalPence}
              onSuccess={handlePaymentSuccess}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            />
          </Elements>
        </DialogContent>
      </Dialog>
    );
  }

  // Details / order form
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Checkout ({items.length} {items.length === 1 ? 'item' : 'items'})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Items summary */}
          <div className="space-y-2 rounded-md border border-[hsl(var(--border))] p-3">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-12 w-12 rounded-md object-cover shrink-0"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--muted))]">
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))]">No img</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {formatPrice(item.pricePence)} x {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-medium text-[hsl(var(--foreground))] shrink-0">
                  {formatPrice(item.pricePence * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Coupon */}
          <CouponInput
            trainerId={trainerId}
            subtotalPence={subtotalPence}
            appliedCode={coupon?.code ?? null}
            onApply={setCoupon}
            onRemove={() => setCoupon(null)}
          />

          {/* Shipping (if any physical items) */}
          {hasPhysical && (
            <div className="space-y-3 rounded-md border border-[hsl(var(--border))] p-3">
              <p className="text-sm font-medium text-[hsl(var(--foreground))]">Shipping details</p>
              <Input
                value={shippingName}
                onChange={(e) => setShippingName(e.target.value)}
                placeholder="Full name"
                className="bg-[hsl(var(--background))] border-[hsl(var(--border))]"
              />
              <textarea
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Delivery address"
                rows={3}
                className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"
              />
            </div>
          )}

          {/* Price summary */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-[hsl(var(--muted-foreground))]">
              <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
              <span>{formatPrice(subtotalPence)}</span>
            </div>
            {discountPence > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatPrice(discountPence)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-[hsl(var(--border))] pt-1 font-semibold text-[hsl(var(--foreground))]">
              <span>Total</span>
              <span>{formatPrice(totalPence)}</span>
            </div>
          </div>

          {createError && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{createError}</div>
          )}

          <Button
            onClick={handleProceedToPayment}
            disabled={isCreating}
            className="w-full"
            size="lg"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating order...
              </>
            ) : (
              `Proceed to payment — ${formatPrice(totalPence)}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
