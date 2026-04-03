import { View, FlatList, RefreshControl, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ShoppingBag,
  ShoppingCart,
  Plus,
} from "lucide-react-native";
import { TouchableOpacity } from "react-native";
import {
  Text,
  Card,
  CardContent,
  Skeleton,
  Badge,
  Button,
  useAlert,
} from "@/components/ui";
import { useTrainerByHandle } from "@/api/trainer";
import { trpc } from "@/lib/trpc";
import { colors } from "@/constants/theme";
import { useCart } from "@/hooks/useCart";

const formatPrice = (pence: number) => `\u00A3${(pence / 100).toFixed(2)}`;

const ShopScreen = () => {
  const { showAlert } = useAlert();
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const { addItem, itemCount } = useCart();

  const { data: trainer, isLoading: trainerLoading } = useTrainerByHandle(
    handle ?? "",
  );
  const t = trainer as any;

  const {
    data: products,
    isLoading: productsLoading,
    refetch,
  } = trpc.product.getPublicProducts.useQuery(
    { trainerId: t?.id ?? "" },
    { enabled: !!t?.id },
  );

  const isLoading = trainerLoading || productsLoading;
  const items = Array.isArray(products) ? products : [];

  const handleAddToCart = (product: any) => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.pricePence,
      imageUrl: product.imageUrl ?? undefined,
      trainerId: t?.id,
      trainerHandle: handle ?? "",
      type: product.type,
    });
    showAlert({
      title: "Added to cart",
      message: `${product.name} has been added to your cart`,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-base font-semibold text-foreground">
            {t?.displayName ? `${t.displayName}'s Shop` : "Shop"}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/shop/cart")}
          className="relative"
        >
          <ShoppingCart size={24} color={colors.foreground} />
          {itemCount > 0 && (
            <View className="absolute -top-2 -right-2 bg-primary rounded-full w-5 h-5 items-center justify-center">
              <Text className="text-[10px] font-bold text-white">
                {itemCount > 99 ? "99+" : itemCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="px-4 py-4 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }: { item: any }) => (
            <Card className="mx-4 mb-3">
              <CardContent className="py-0 px-0">
                <View className="flex-row">
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      className="w-28 h-28 rounded-l-lg"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-28 h-28 rounded-l-lg bg-secondary items-center justify-center">
                      <ShoppingBag size={28} color={colors.mutedForeground} />
                    </View>
                  )}
                  <View className="flex-1 p-3 gap-1 justify-between">
                    <View className="gap-1">
                      <Text
                        className="text-sm font-semibold text-foreground"
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      {item.shortDescription && (
                        <Text
                          className="text-xs text-muted-foreground"
                          numberOfLines={2}
                        >
                          {item.shortDescription}
                        </Text>
                      )}
                      <View className="flex-row items-center gap-2">
                        <Text className="text-sm font-medium text-teal">
                          {formatPrice(item.pricePence)}
                        </Text>
                        {item.compareAtPricePence &&
                          item.compareAtPricePence > item.pricePence && (
                            <Text className="text-xs text-muted-foreground line-through">
                              {formatPrice(item.compareAtPricePence)}
                            </Text>
                          )}
                        <Badge variant="secondary">
                          {item.type === "DIGITAL" ? "Digital" : "Physical"}
                        </Badge>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleAddToCart(item)}
                      className="flex-row items-center gap-1 bg-primary rounded-md py-1.5 px-3 self-start"
                    >
                      <Plus size={14} color="#fff" />
                      <Text className="text-xs font-semibold text-white">
                        Add to Cart
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </CardContent>
            </Card>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-12 gap-2">
              <ShoppingBag size={48} color={colors.mutedForeground} />
              <Text className="text-base text-muted-foreground">
                No products available
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetch}
              tintColor={colors.teal}
            />
          }
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
};

export default ShopScreen;
