import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, ExternalLink, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Label,
  Switch,
  Badge,
  Button,
  Input,
  Select,
} from '@/components/ui';
import type { SelectOption } from '@/components/ui';
import {
  usePaymentSettings,
  useUpdateSessionPrice,
  useUpdateCancellationPolicy,
  useUpdatePaymentSettings,
  useCreateOnboardingLink,
  useRefreshConnectStatus,
  useGetDashboardLink,
} from '@/api/payment';
import { toast } from '@/lib/toast';

const FULL_REFUND_OPTIONS: SelectOption[] = [
  { value: '24', label: '24 hours' },
  { value: '48', label: '48 hours' },
  { value: '72', label: '72 hours' },
];

const PARTIAL_REFUND_OPTIONS: SelectOption[] = [
  { value: '0', label: 'No partial refund' },
  { value: '12', label: '12 hours' },
  { value: '24', label: '24 hours' },
  { value: '48', label: '48 hours' },
];

const PARTIAL_PERCENT_OPTIONS: SelectOption[] = [
  { value: '25', label: '25%' },
  { value: '50', label: '50%' },
  { value: '75', label: '75%' },
];

export const PaymentSettings = () => {
  const [searchParams] = useSearchParams();
  const { data, isLoading } = usePaymentSettings();
  const updatePriceMutation = useUpdateSessionPrice();
  const updatePolicyMutation = useUpdateCancellationPolicy();
  const updateSettingsMutation = useUpdatePaymentSettings();
  const onboardingMutation = useCreateOnboardingLink();
  const refreshStatusMutation = useRefreshConnectStatus();
  const dashboardMutation = useGetDashboardLink();

  const [priceInput, setPriceInput] = useState('');
  const [priceDirty, setPriceDirty] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize price input from server data
  useEffect(() => {
    if (data?.sessionPrice && !priceDirty) {
      setPriceInput((data.sessionPrice.amount / 100).toFixed(2));
    }
  }, [data?.sessionPrice, priceDirty]);

  // Auto-clear error messages
  useEffect(() => {
    if (!errorMessage) return;
    const timer = setTimeout(() => setErrorMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [errorMessage]);

  // Auto-refresh Stripe status when returning from onboarding
  useEffect(() => {
    if (searchParams.get('stripe') === 'complete') {
      refreshStatusMutation.mutate(undefined, {
        onSuccess: (result) => {
          if (result.onboardingComplete) {
            toast.success('Stripe onboarding complete! You can now accept payments.');
          } else {
            setErrorMessage(
              'Stripe onboarding not yet complete. Please finish all required steps.',
            );
          }
        },
      });
    }
  }, [searchParams]);

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading...</div>;
  if (!data) return null;

  const handleTogglePayments = (checked: boolean) => {
    if (checked && !data.stripeOnboardingComplete) {
      setErrorMessage('Complete Stripe onboarding first');
      return;
    }
    if (checked && !data.sessionPrice) {
      setErrorMessage('Set a session price first');
      return;
    }
    updateSettingsMutation.mutate({ paymentsEnabled: checked });
  };

  const handleToggleFirstFree = (checked: boolean) => {
    updateSettingsMutation.mutate({ firstSessionFree: checked });
  };

  const handleSavePrice = () => {
    const pounds = parseFloat(priceInput);
    if (isNaN(pounds) || pounds < 1 || pounds > 1000) {
      setErrorMessage('Price must be between £1.00 and £1,000.00');
      return;
    }
    const pence = Math.round(pounds * 100);
    updatePriceMutation.mutate(
      { amount: pence },
      {
        onSuccess: () => {
          setPriceDirty(false);
          toast.success('Session price updated');
        },
      },
    );
  };

  const handleSavePolicy = (field: string, value: string) => {
    const current = data.cancellationPolicy ?? {
      fullRefundHours: 48,
      partialRefundHours: 24,
      partialRefundPercent: 50,
    };
    const updated = { ...current, [field]: parseInt(value, 10) };

    if (updated.partialRefundHours >= updated.fullRefundHours && updated.partialRefundHours > 0) {
      setErrorMessage('Partial refund window must be less than full refund window');
      return;
    }

    updatePolicyMutation.mutate(updated, {
      onSuccess: () => toast.success('Cancellation policy updated'),
    });
  };

  const handleStartOnboarding = () => {
    onboardingMutation.mutate(undefined, {
      onSuccess: (result) => {
        window.open(result.url, '_blank');
      },
      onError: () => {
        setErrorMessage('Failed to start Stripe onboarding');
      },
    });
  };

  const handleOpenDashboard = () => {
    dashboardMutation.mutate(undefined, {
      onSuccess: (result) => {
        window.open(result.url, '_blank');
      },
    });
  };

  const policy = data.cancellationPolicy ?? {
    fullRefundHours: 48,
    partialRefundHours: 24,
    partialRefundPercent: 50,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-4 w-4" />
          Session Payments
          <Badge variant="secondary" className="text-xs">
            ELITE
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error message */}
        {errorMessage && (
          <div className="text-sm px-3 py-2 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        {/* Stripe Connect status */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Stripe Connect</Label>
              <p className="text-xs text-muted-foreground">
                Connect your bank account to receive payouts
              </p>
            </div>
            {data.stripeOnboardingComplete ? (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Connected
              </Badge>
            ) : data.stripeConnectedAccountId ? (
              <Badge variant="warning" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Incomplete
              </Badge>
            ) : null}
          </div>
          <div className="flex gap-2">
            {!data.stripeOnboardingComplete ? (
              <Button
                size="sm"
                onClick={handleStartOnboarding}
                disabled={onboardingMutation.isPending}
              >
                {onboardingMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                {data.stripeConnectedAccountId ? 'Continue Setup' : 'Set Up Stripe'}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenDashboard}
                disabled={dashboardMutation.isPending}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Manage Payouts
              </Button>
            )}
          </div>
        </div>

        {/* Accept payments toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm">Accept session payments</Label>
            <p className="text-xs text-muted-foreground">Charge clients when they book a session</p>
          </div>
          <Switch
            checked={data.paymentsEnabled}
            onCheckedChange={handleTogglePayments}
            disabled={updateSettingsMutation.isPending}
          />
        </div>

        {/* Session price */}
        <div className="space-y-2">
          <Label className="text-sm">Session price</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">&pound;</span>
            <Input
              type="number"
              step="0.01"
              min="1"
              max="1000"
              placeholder="50.00"
              value={priceInput}
              onChange={(e) => {
                setPriceInput(e.target.value);
                setPriceDirty(true);
              }}
              className="w-32"
            />
            <Button
              size="sm"
              onClick={handleSavePrice}
              disabled={!priceDirty || updatePriceMutation.isPending}
            >
              {updatePriceMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                'Save'
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            A &pound;0.50 platform fee + Stripe processing fees will be deducted from each payment
          </p>
        </div>

        {/* First session free */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm">First session free</Label>
            <p className="text-xs text-muted-foreground">
              New clients won't be charged for their first booking
            </p>
          </div>
          <Switch
            checked={data.firstSessionFree}
            onCheckedChange={handleToggleFirstFree}
            disabled={updateSettingsMutation.isPending}
          />
        </div>

        {/* Cancellation policy */}
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium">Cancellation policy</Label>
            <p className="text-xs text-muted-foreground">
              Define your refund rules when clients cancel
            </p>
          </div>
          <div className="grid gap-3">
            <div className="flex items-center gap-3">
              <Label
                className="text-xs text-muted-foreground w-40 shrink-0"
                htmlFor="full-refund-hours"
              >
                Full refund if cancelled
              </Label>
              <Select
                inputId="full-refund-hours"
                options={FULL_REFUND_OPTIONS}
                value={
                  FULL_REFUND_OPTIONS.find((o) => o.value === String(policy.fullRefundHours)) ??
                  null
                }
                onChange={(option) => {
                  if (option) handleSavePolicy('fullRefundHours', option.value);
                }}
                className="w-40"
              />
              <span className="text-xs text-muted-foreground">before session</span>
            </div>
            <div className="flex items-center gap-3">
              <Label
                className="text-xs text-muted-foreground w-40 shrink-0"
                htmlFor="partial-refund-hours"
              >
                Partial refund if cancelled
              </Label>
              <Select
                inputId="partial-refund-hours"
                options={PARTIAL_REFUND_OPTIONS}
                value={
                  PARTIAL_REFUND_OPTIONS.find(
                    (o) => o.value === String(policy.partialRefundHours),
                  ) ?? null
                }
                onChange={(option) => {
                  if (option) handleSavePolicy('partialRefundHours', option.value);
                }}
                className="w-40"
              />
              <span className="text-xs text-muted-foreground">before session</span>
            </div>
            {policy.partialRefundHours > 0 && (
              <div className="flex items-center gap-3">
                <Label
                  className="text-xs text-muted-foreground w-40 shrink-0"
                  htmlFor="partial-refund-percent"
                >
                  Partial refund amount
                </Label>
                <Select
                  inputId="partial-refund-percent"
                  options={PARTIAL_PERCENT_OPTIONS}
                  value={
                    PARTIAL_PERCENT_OPTIONS.find(
                      (o) => o.value === String(policy.partialRefundPercent),
                    ) ?? null
                  }
                  onChange={(option) => {
                    if (option) handleSavePolicy('partialRefundPercent', option.value);
                  }}
                  className="w-40"
                />
                <span className="text-xs text-muted-foreground">of session price</span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Cancellations within{' '}
            {policy.partialRefundHours > 0
              ? `${policy.partialRefundHours} hours`
              : 'the partial refund window'}{' '}
            receive no refund
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
