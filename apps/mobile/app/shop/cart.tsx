import { useState } from "react";
import { View, ScrollView, Image, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Tag,
  ShoppingBag,
} from "lucide-react-native";
import { TouchableOpacity } from "react-native";
import * as WebBrowser from "expo-web-browser";
import {
  Text,
  Card,
  CardContent,
  Button,
  Input,
  useAlert,
} from "@/components/ui";
import { trpc } from "@/lib/trpc";
import { colors } from "@/constants/theme";
import { useCart } from "@/hooks/useCart";

const formatPrice = (pence: number) => `\u00A3${(pence / 100).toFixed(2)}`;

const CartScreen = () => {
  const { showAlert } = useAlert();
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearCart, total, itemCount } =
    useCart();

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountPence: number;
  } | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // All items must be from the same trainer for a single order
  const trainerId = items[0]?.trainerId ?? "";
  const trainerHandle = items[0]?.trainerHandle ?? "";
  const hasPhysical = items.some((i) => i.type === "PHYSICAL");

  const subtotal = total;
  const discount = appliedCoupon?.discountPence ?? 0;
  const orderTotal = Math.max(subtotal - discount, 1);

  const createOrder = trpc.order.create.useMutation();
  const createCheckout = trpc.order.createCheckoutSession.useMutation();

  // Validate coupon
  const validateCoupon = trpc.coupon.validate.useQuery(
    {
      trainerId,
      code: couponCode.trim().toUpperCase(),
      subtotalPence: subtotal,
    },
    { enabled: false },
  );

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const result = await validateCoupon.refetch();
      if (result.data) {
        setAppliedCoupon({
          code: couponCode.trim().toUpperCase(),
          discountPence: (result.data as any).discountPence ?? 0,
        });
        showAlert({
          title: "Coupon applied",
          message: "Discount has been applied to your order",
        });
      }
    } catch {
      showAlert({
        title: "Invalid coupon",
        message: "This coupon code is not valid",
      });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;

    setIsCheckingOut(true);
    try {
      // Step 1: Create order
      const order = await createOrder.mutateAsync({
        trainerId,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        couponCode: appliedCoupon?.code,
      });

      // Step 2: Create checkout session
      const session = await createCheckout.mutateAsync({
        orderId: order.orderId,
      });

      // Step 3: Open Stripe Checkout in browser
      if (session.url) {
        await WebBrowser.openBrowserAsync(session.url);

        // On return, clear cart and navigate to purchases
        clearCart();
        setAppliedCoupon(null);
        setCouponCode("");
        router.replace("/dashboard/purchases?status=success");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to start checkout";
      showAlert({ title: "Checkout failed", message });
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-base font-semibold text-foreground">Cart</Text>
        </View>
        <View className="flex-1 items-center justify-center gap-3">
          <ShoppingCart size={48} color={colors.mutedForeground} />
          <Text className="text-lg text-foreground">Your cart is empty</Text>
          <Text className="text-sm text-muted-foreground text-center px-8">
            Browse a trainer's shop to add products
          </Text>
          <Button size="sm" variant="outline" onPress={() => router.back()}>
            Continue Shopping
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-base font-semibold text-foreground">
            Cart ({itemCount})
          </Text>
        </View>
        <TouchableOpacity onPress={clearCart}>
          <Text className="text-sm text-muted-foreground">Clear all</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4 gap-3 pb-8"
      >
        {/* Cart items */}
        {items.map((item) => (
          <Card key={item.productId}>
            <CardContent className="py-3 px-3">
              <View className="flex-row gap-3">
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    className="w-16 h-16 rounded-lg"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-16 h-16 rounded-lg bg-secondary items-center justify-center">
                    <ShoppingBag size={20} color={colors.mutedForeground} />
                  </View>
                )}
                <View className="flex-1 gap-1">
                  <Text
                    className="text-sm font-semibold text-foreground"
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text className="text-sm text-teal font-medium">
                    {formatPrice(item.price)}
                  </Text>
                  <View className="flex-row items-center justify-between mt-1">
                    <View className="flex-row items-center gap-2">
                      <TouchableOpacity
                        onPress={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        disabled={item.quantity <= 1}
                        className="w-7 h-7 rounded border border-border items-center justify-center"
                        style={{ opacity: item.quantity <= 1 ? 0.4 : 1 }}
                      >
                        <Minus size={14} color={colors.foreground} />
                      </TouchableOpacity>
                      <Text className="text-sm font-medium text-foreground w-6 text-center">
                        {item.quantity}
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        className="w-7 h-7 rounded border border-border items-center justify-center"
                      >
                        <Plus size={14} color={colors.foreground} />
                      </TouchableOpacity>
                    </View>
                    <View className="flex-row items-center gap-3">
                      <Text className="text-sm font-semibold text-foreground">
                        {formatPrice(item.price * item.quantity)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeItem(item.productId)}
                      >
                        <Trash2 size={16} color={colors.destructive} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>
        ))}

        {/* Coupon code */}
        <Card>
          <CardContent className="py-3 px-3">
            <View className="flex-row items-center gap-2 mb-2">
              <Tag size={14} color={colors.teal} />
              <Text className="text-sm font-medium text-foreground">
                Coupon Code
              </Text>
            </View>
            {appliedCoupon ? (
              <View className="flex-row items-center justify-between bg-secondary rounded-lg p-2">
                <View className="flex-row items-center gap-2">
                  <Tag size={14} color={colors.teal} />
                  <Text className="text-sm text-teal font-medium">
                    {appliedCoupon.code}
                  </Text>
                  <Text className="text-sm text-teal">
                    -{formatPrice(appliedCoupon.discountPence)}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleRemoveCoupon}>
                  <Text className="text-sm text-muted-foreground">Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Input
                    value={couponCode}
                    onChangeText={setCouponCode}
                    placeholder="Enter coupon code"
                    autoCapitalize="characters"
                  />
                </View>
                <Button
                  size="sm"
                  variant="outline"
                  onPress={handleApplyCoupon}
                  disabled={!couponCode.trim()}
                >
                  Apply
                </Button>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Order summary */}
        <Card>
          <CardContent className="py-4 px-4 gap-2">
            <Text
              className="text-sm font-extralight text-foreground uppercase"
              style={{ letterSpacing: 1 }}
            >
              Order Summary
            </Text>
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted-foreground">
                Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
              </Text>
              <Text className="text-sm text-foreground">
                {formatPrice(subtotal)}
              </Text>
            </View>
            {discount > 0 && (
              <View className="flex-row justify-between">
                <Text className="text-sm text-teal">Discount</Text>
                <Text className="text-sm text-teal">
                  -{formatPrice(discount)}
                </Text>
              </View>
            )}
            <View className="border-t border-border mt-1 pt-2 flex-row justify-between">
              <Text className="text-base font-semibold text-foreground">
                Total
              </Text>
              <Text className="text-base font-semibold text-foreground">
                {formatPrice(orderTotal)}
              </Text>
            </View>
          </CardContent>
        </Card>

        {/* Checkout button */}
        <Button
          onPress={handleCheckout}
          loading={isCheckingOut}
          className="mt-2"
        >
          Checkout — {formatPrice(orderTotal)}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CartScreen;
