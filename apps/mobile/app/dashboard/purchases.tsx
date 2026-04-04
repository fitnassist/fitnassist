import { useEffect } from "react";
import { View, FlatList, RefreshControl } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Package, ShoppingBag, Download } from "lucide-react-native";
import { TouchableOpacity } from "react-native";
import * as WebBrowser from "expo-web-browser";
import {
  Text,
  Card,
  CardContent,
  Skeleton,
  Badge,
  useAlert,
} from "@/components/ui";
import { trpc } from "@/lib/trpc";
import { colors } from "@/constants/theme";

const PurchasesScreen = () => {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { status } = useLocalSearchParams<{ status?: string }>();
  const { data: orders, isLoading, refetch } = trpc.order.myOrders.useQuery();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (status === "success") {
      showAlert({
        title: "Order confirmed",
        message: "Your purchase was successful!",
      });
      refetch();
    }
  }, [status]);

  const handleDownload = async (orderId: string, productId: string) => {
    try {
      const result = await utils.order.getDownloadUrl.fetch({
        orderId,
        productId,
      });
      if (result?.url) {
        await WebBrowser.openBrowserAsync(result.url);
      }
    } catch {
      showAlert({ title: "Error", message: "Failed to get download link" });
    }
  };

  const orderList = (orders as any)?.orders ?? orders ?? [];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">
          Purchases
        </Text>
      </View>

      {isLoading ? (
        <View className="px-4 py-4 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </View>
      ) : (
        <FlatList
          data={orderList}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }: { item: any }) => {
            const isDigital = item.items?.some?.(
              (i: any) => i.product?.type === "DIGITAL",
            );
            const isDownloadable =
              isDigital &&
              (item.status === "PAID" || item.status === "DELIVERED");

            return (
              <Card className="mx-4 mb-2">
                <CardContent className="py-3 px-4 gap-2">
                  <View className="flex-row items-center gap-3">
                    <Package size={20} color={colors.teal} />
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-foreground">
                        {item.items?.length > 1
                          ? `${item.items.length} items`
                          : (item.items?.[0]?.productName ??
                            item.product?.name ??
                            "Order")}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()} · £
                        {(
                          (item.totalPence ?? item.totalAmount ?? 0) / 100
                        ).toFixed(2)}
                      </Text>
                    </View>
                    <Badge
                      variant={
                        item.status === "DELIVERED" || item.status === "PAID"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {item.status}
                    </Badge>
                  </View>
                  {isDownloadable &&
                    item.items
                      ?.filter((i: any) => i.product?.type === "DIGITAL")
                      .map((i: any) => (
                        <TouchableOpacity
                          key={i.productId}
                          onPress={() => handleDownload(item.id, i.productId)}
                          className="flex-row items-center gap-2 bg-secondary rounded-lg py-2 px-3"
                        >
                          <Download size={14} color={colors.teal} />
                          <Text className="text-xs text-teal font-medium">
                            Download {i.productName}
                          </Text>
                        </TouchableOpacity>
                      ))}
                </CardContent>
              </Card>
            );
          }}
          ListEmptyComponent={
            <View className="items-center justify-center py-12 gap-2">
              <ShoppingBag size={48} color={colors.mutedForeground} />
              <Text className="text-base text-muted-foreground">
                No purchases yet
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

export default PurchasesScreen;
