import { useState } from 'react';
import { View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Crown, Zap, Star } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { Text, Button, Card, CardContent, Skeleton, Badge, useAlert } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { colors } from '@/constants/theme';
import {
  TIER_INFO,
  FREE_TIER_INFO,
  formatPricePence,
} from '@fitnassist/schemas/src/constants/subscription.constants';

const TIER_ICONS: Record<string, any> = { FREE: Star, PRO: Zap, ELITE: Crown };

const SubscriptionScreen = () => {
  const { showAlert } = useAlert();
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const { data: current, isLoading, refetch } = trpc.subscription.getCurrent.useQuery();
  const createCheckout = trpc.subscription.createCheckoutSession.useMutation();
  const createPortal = trpc.subscription.createPortalSession.useMutation();

  const currentTier = current?.effectiveTier ?? 'FREE';

  const handleSubscribe = async (tier: string) => {
    try {
      const result = await createCheckout.mutateAsync({ tier, billingPeriod } as any);
      if (result.url) {
        await WebBrowser.openBrowserAsync(result.url);
        refetch();
      }
    } catch {
      showAlert({ title: 'Error', message: 'Failed to start checkout' });
    }
  };

  const handleManage = async () => {
    try {
      const result = await createPortal.mutateAsync();
      if (result.url) {
        await WebBrowser.openBrowserAsync(result.url);
        refetch();
      }
    } catch {
      showAlert({ title: 'Error', message: 'Failed to open billing portal' });
    }
  };

  const tiers = [
    { id: 'FREE' as const, info: FREE_TIER_INFO },
    { id: 'PRO' as const, info: TIER_INFO.PRO },
    { id: 'ELITE' as const, info: TIER_INFO.ELITE },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">Subscription</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4 gap-4 pb-8"
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.teal} />}
      >
        {isLoading ? (
          <View className="gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
          </View>
        ) : (
          <>
            {/* Billing period toggle */}
            <View className="flex-row bg-card border border-border rounded-lg p-1">
              <TouchableOpacity
                className={`flex-1 items-center py-2 rounded-md ${billingPeriod === 'MONTHLY' ? 'bg-primary' : ''}`}
                onPress={() => setBillingPeriod('MONTHLY')}
              >
                <Text className={`text-sm font-medium ${billingPeriod === 'MONTHLY' ? 'text-white' : 'text-muted-foreground'}`}>Monthly</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 items-center py-2 rounded-md ${billingPeriod === 'ANNUAL' ? 'bg-primary' : ''}`}
                onPress={() => setBillingPeriod('ANNUAL')}
              >
                <Text className={`text-sm font-medium ${billingPeriod === 'ANNUAL' ? 'text-white' : 'text-muted-foreground'}`}>Yearly (2 months free)</Text>
              </TouchableOpacity>
            </View>

            {tiers.map(({ id, info }) => {
              const isCurrent = currentTier === id;
              const Icon = TIER_ICONS[id] ?? Star;
              const price = billingPeriod === 'ANNUAL' ? info.annualPricePence : info.monthlyPricePence;
              const monthlyEquivalent = billingPeriod === 'ANNUAL' ? Math.round(info.annualPricePence / 12) : info.monthlyPricePence;

              return (
                <Card key={id} className={isCurrent ? 'border-primary' : ''}>
                  <CardContent className="py-5 px-4 gap-3">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Icon size={20} color={isCurrent ? colors.primary : colors.teal} />
                        <Text className="text-lg font-semibold text-foreground">{info.name}</Text>
                      </View>
                      {isCurrent && <Badge>Current</Badge>}
                    </View>

                    <Text className="text-sm text-muted-foreground">{info.description}</Text>

                    <View>
                      <Text className="text-2xl font-bold text-foreground">
                        {id === 'FREE' ? 'Free' : `${formatPricePence(monthlyEquivalent)}/mo`}
                      </Text>
                      {billingPeriod === 'ANNUAL' && id !== 'FREE' && (
                        <Text className="text-xs text-muted-foreground">
                          {formatPricePence(price)} billed annually
                        </Text>
                      )}
                    </View>

                    <View className="gap-2">
                      {info.features.map((feature) => (
                        <View key={feature} className="flex-row items-center gap-2">
                          <Check size={14} color={colors.teal} />
                          <Text className="text-sm text-foreground">{feature}</Text>
                        </View>
                      ))}
                    </View>

                    {!isCurrent && id !== 'FREE' && (
                      <Button
                        onPress={() => handleSubscribe(id)}
                        loading={createCheckout.isPending}
                        className="mt-2"
                      >
                        {currentTier === 'FREE' ? `Upgrade to ${info.name}` : `Switch to ${info.name}`}
                      </Button>
                    )}
                    {id === 'FREE' && !isCurrent && (
                      <Text className="text-xs text-muted-foreground text-center">
                        Downgrade via Manage Billing below
                      </Text>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {currentTier !== 'FREE' && (
              <Button variant="outline" onPress={handleManage} loading={createPortal.isPending}>
                Manage Billing
              </Button>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SubscriptionScreen;
