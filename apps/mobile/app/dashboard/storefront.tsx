import { View, FlatList, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ShoppingBag, Plus } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Text, Card, CardContent, Skeleton, Badge, Button } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { colors } from '@/constants/theme';

const apiUrl = Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:3001';
const webUrl = apiUrl.replace(':3001', ':5173');

const StorefrontScreen = () => {
  const router = useRouter();
  const { data: products, isLoading, refetch } = trpc.product.list.useQuery({});

  const items = Array.isArray(products) ? products : (products as any)?.items ?? [];

  const openWebEditor = () => {
    WebBrowser.openBrowserAsync(`${webUrl}/dashboard/storefront`);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-base font-semibold text-foreground">Storefront</Text>
        </View>
        <TouchableOpacity onPress={openWebEditor} className="flex-row items-center gap-1">
          <Plus size={18} color={colors.teal} />
          <Text className="text-sm font-medium text-teal">Add</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="px-4 py-4 gap-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }: { item: any }) => (
            <Card className="mx-4 mb-2">
              <CardContent className="py-3 px-4 flex-row items-center gap-3">
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} className="w-14 h-14 rounded-lg" />
                ) : (
                  <View className="w-14 h-14 rounded-lg bg-secondary items-center justify-center">
                    <ShoppingBag size={20} color={colors.mutedForeground} />
                  </View>
                )}
                <View className="flex-1 gap-0.5">
                  <Text className="text-sm font-semibold text-foreground">{item.name}</Text>
                  {item.priceInCents != null && (
                    <Text className="text-sm text-teal font-medium">
                      £{(item.priceInCents / 100).toFixed(2)}
                    </Text>
                  )}
                </View>
                <Badge variant={item.isPublished ? 'default' : 'secondary'}>
                  {item.isPublished ? 'Live' : 'Draft'}
                </Badge>
              </CardContent>
            </Card>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-12 gap-3">
              <ShoppingBag size={48} color={colors.mutedForeground} />
              <Text className="text-base text-muted-foreground">No products yet</Text>
              <Button size="sm" onPress={openWebEditor}>Create Product</Button>
            </View>
          }
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.teal} />}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
};

export default StorefrontScreen;
