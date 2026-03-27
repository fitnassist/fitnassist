import { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Shield, Loader2 } from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { stripePromise } from '@/lib/stripe';

interface PaymentInfo {
  amount: number;
  currency: string;
  cancellationPolicy: {
    fullRefundHours: number;
    partialRefundHours: number;
    partialRefundPercent: number;
  } | null;
}

interface PaymentStepProps {
  clientSecret: string;
  paymentInfo: PaymentInfo;
  onSuccess: () => void;
  onBack: () => void;
  isFirstFree?: boolean;
}

const formatPrice = (amount: number, currency: string = 'gbp') => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

const CheckoutForm = ({ paymentInfo, onSuccess, onBack }: {
  paymentInfo: PaymentInfo;
  onSuccess: () => void;
  onBack: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
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

  const policy = paymentInfo.cancellationPolicy;

  return (
    <div className="space-y-4">
      {/* Price summary */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Session Price</span>
            </div>
            <span className="text-lg font-semibold">
              {formatPrice(paymentInfo.amount, paymentInfo.currency)}
            </span>
          </div>

          {/* Cancellation policy */}
          {policy && (
            <div className="border-t pt-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Shield className="h-3 w-3" />
                Cancellation Policy
              </div>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                <li>Full refund if cancelled {policy.fullRefundHours}+ hours before</li>
                {policy.partialRefundHours > 0 && (
                  <li>{policy.partialRefundPercent}% refund if cancelled {policy.partialRefundHours}+ hours before</li>
                )}
                <li>No refund within {policy.partialRefundHours || policy.fullRefundHours} hours of session</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stripe Payment Element */}
      <div className="rounded-lg border p-4">
        <PaymentElement />
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-300 px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={isProcessing}>
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!stripe || isProcessing}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ${formatPrice(paymentInfo.amount, paymentInfo.currency)}`
          )}
        </Button>
      </div>
    </div>
  );
};

export const PaymentStep = ({ clientSecret, paymentInfo, onSuccess, onBack, isFirstFree }: PaymentStepProps) => {
  if (isFirstFree) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4 text-center space-y-3">
            <Badge variant="success" className="text-sm">First Session Free</Badge>
            <p className="text-sm text-muted-foreground">
              This is your first session — no payment required!
            </p>
          </CardContent>
        </Card>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack}>Back</Button>
          <Button onClick={onSuccess} className="flex-1">Confirm Booking</Button>
        </div>
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div className="text-sm text-muted-foreground">
        Payment is not configured. Please contact support.
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            borderRadius: '8px',
          },
        },
      }}
    >
      <CheckoutForm paymentInfo={paymentInfo} onSuccess={onSuccess} onBack={onBack} />
    </Elements>
  );
};
