import { View, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Package, ShoppingBag } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Card, CardContent, Skeleton, Badge } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { colors } from '@/constants/theme';

const PurchasesScreen = () => {
  const router = useRouter();
  const { data: orders, isLoading, refetch } = trpc.order.myOrders.useQuery();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">Purchases</Text>
      </View>

      {isLoading ? (
        <View className="px-4 py-4 gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </View>
      ) : (
        <FlatList
          data={(orders as any)?.orders ?? orders ?? []}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }: { item: any }) => (
            <Card className="mx-4 mb-2">
              <CardContent className="py-3 px-4 flex-row items-center gap-3">
                <Package size={20} color={colors.teal} />
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground">{item.product?.name ?? 'Order'}</Text>
                  <Text className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString()} · £{((item.totalAmount ?? 0) / 100).toFixed(2)}
                  </Text>
                </View>
                <Badge variant={item.status === 'COMPLETED' ? 'default' : 'secondary'}>
                  {item.status}
                </Badge>
              </CardContent>
            </Card>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-12 gap-2">
              <ShoppingBag size={48} color={colors.mutedForeground} />
              <Text className="text-base text-muted-foreground">No purchases yet</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.teal} />}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
};

export default PurchasesScreen;
