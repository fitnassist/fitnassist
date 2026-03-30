import { View, ScrollView, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Crown, Zap, Star } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Text, Button, Card, CardContent, Skeleton, Badge } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { colors } from '@/constants/theme';

const TIERS = [
  {
    id: 'FREE',
    name: 'Free',
    price: '£0',
    icon: Star,
    features: ['Basic profile', 'Messaging', 'Up to 3 clients'],
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: '£19/mo',
    icon: Zap,
    features: ['Unlimited clients', 'Bookings & calendar', 'Resources library', 'Client management', 'Analytics'],
  },
  {
    id: 'ELITE',
    name: 'Elite',
    price: '£39/mo',
    icon: Crown,
    features: ['Everything in Pro', 'Website builder', 'Product storefront', 'Advanced analytics', 'Video calls', 'Priority support'],
  },
];

const SubscriptionScreen = () => {
  const router = useRouter();
  const { data: current, isLoading, refetch } = trpc.subscription.getCurrent.useQuery();
  const createCheckout = trpc.subscription.createCheckoutSession.useMutation();
  const createPortal = trpc.subscription.createPortalSession.useMutation();

  const currentTier = current?.effectiveTier ?? 'FREE';

  const handleSubscribe = async (tier: string) => {
    try {
      const result = await createCheckout.mutateAsync({ tier } as any);
      if (result.url) {
        await WebBrowser.openBrowserAsync(result.url);
        refetch();
      }
    } catch {
      Alert.alert('Error', 'Failed to start checkout');
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
      Alert.alert('Error', 'Failed to open billing portal');
    }
  };

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
            {TIERS.map((tier) => {
              const isCurrent = currentTier === tier.id;
              const Icon = tier.icon;

              return (
                <Card key={tier.id} className={isCurrent ? 'border-primary' : ''}>
                  <CardContent className="py-5 px-4 gap-3">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Icon size={20} color={isCurrent ? colors.primary : colors.teal} />
                        <Text className="text-lg font-semibold text-foreground">{tier.name}</Text>
                      </View>
                      {isCurrent && <Badge>Current</Badge>}
                    </View>

                    <Text className="text-2xl font-bold text-foreground">{tier.price}</Text>

                    <View className="gap-2">
                      {tier.features.map((feature) => (
                        <View key={feature} className="flex-row items-center gap-2">
                          <Check size={14} color={colors.teal} />
                          <Text className="text-sm text-foreground">{feature}</Text>
                        </View>
                      ))}
                    </View>

                    {!isCurrent && tier.id !== 'FREE' && (
                      <Button
                        onPress={() => handleSubscribe(tier.id)}
                        loading={createCheckout.isPending}
                        className="mt-2"
                      >
                        {currentTier === 'FREE' ? `Upgrade to ${tier.name}` : `Switch to ${tier.name}`}
                      </Button>
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
