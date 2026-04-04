import { useState, useCallback } from "react";
import {
  View,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, ScanBarcode, Camera } from "lucide-react-native";
import { Text, Button, Card, CardContent } from "@/components/ui";
import { trpc } from "@/lib/trpc";
import { colors } from "@/constants/theme";

const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CUTOUT_SIZE = SCREEN_WIDTH * 0.7;

const ScanScreen = () => {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<string>("BREAKFAST");
  const [showNotFound, setShowNotFound] = useState(false);
  const [servings, setServings] = useState("1");
  const utils = trpc.useUtils();

  const {
    data: product,
    isLoading: lookingUp,
    error: lookupError,
  } = trpc.diary.lookupBarcode.useQuery(
    { barcode: scannedBarcode! },
    { enabled: !!scannedBarcode, retry: false },
  );

  const logFood = trpc.diary.logFood.useMutation();

  const today = new Date().toISOString().split("T")[0]!;

  const handleBarcodeScan = useCallback(
    (result: { data: string }) => {
      if (scannedBarcode) return;
      setScannedBarcode(result.data);
      setShowNotFound(false);
    },
    [scannedBarcode],
  );

  const handleScanAnother = () => {
    setScannedBarcode(null);
    setShowNotFound(false);
    setServings("1");
  };

  const qty = Math.max(parseFloat(servings) || 1, 0.1);

  const handleAddToDiary = () => {
    if (!product) return;

    logFood.mutate(
      {
        date: today,
        items: [
          {
            name: product.food_name,
            mealType: selectedMeal as any,
            calories: Math.round((product.calories ?? 0) * qty),
            proteinG: Math.round((product.protein_g ?? 0) * qty * 10) / 10,
            carbsG: Math.round((product.carbs_g ?? 0) * qty * 10) / 10,
            fatG: Math.round((product.fat_g ?? 0) * qty * 10) / 10,
            servingSize: qty,
            servingUnit: product.serving_unit || 'serving',
          },
        ],
      },
      {
        onSuccess: () => {
          utils.diary.getEntries.invalidate({ date: today });
          utils.diary.getDailyNutrition.invalidate({ date: today });
          router.back();
        },
      },
    );
  };

  // Show not found state when query completed with null result
  const isNotFound =
    scannedBarcode && !lookingUp && !product && !lookupError
      ? true
      : showNotFound;

  // Permission not yet determined
  if (!permission) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={colors.teal} size="large" />
      </SafeAreaView>
    );
  }

  // Permission not granted
  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="absolute top-4 left-4 z-10">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-background/80 items-center justify-center"
          >
            <X size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View className="flex-1 items-center justify-center px-8 gap-6">
          <View
            style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(94, 206, 187, 0.15)' }}
          >
            <Camera size={40} color="#5ECEBB" />
          </View>
          <Text className="text-xl font-semibold text-foreground text-center">
            Camera Access Required
          </Text>
          <Text className="text-sm text-muted-foreground text-center leading-5">
            To scan food barcodes, Fitnassist needs access to your camera. Your
            camera is only used for scanning and no images are stored.
          </Text>
          {permission.canAskAgain ? (
            <Button onPress={requestPermission} className="w-full">
              Grant Permission
            </Button>
          ) : (
            <Button onPress={() => Linking.openSettings()} className="w-full">
              Open Settings
            </Button>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Camera */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
        }}
        onBarcodeScanned={scannedBarcode ? undefined : handleBarcodeScan}
      />

      {/* Overlay */}
      <View style={StyleSheet.absoluteFillObject}>
        {/* Top overlay */}
        <View style={styles.overlayTop} />

        {/* Middle row with cutout */}
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={styles.cutout}>
            {/* Corner markers */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.overlaySide} />
        </View>

        {/* Bottom overlay */}
        <View style={styles.overlayBottom} />
      </View>

      {/* Safe area controls */}
      <SafeAreaView
        style={StyleSheet.absoluteFillObject}
        edges={["top", "bottom"]}
        pointerEvents="box-none"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <X size={22} color="#fff" />
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text className="text-white text-base font-semibold">
              Scan Barcode
            </Text>
          </View>
          <View className="w-10" />
        </View>

        {/* Instruction */}
        {!scannedBarcode && (
          <View className="items-center mt-8">
            <View
              className="flex-row items-center gap-2 px-4 py-2 rounded-full"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            >
              <ScanBarcode size={16} color={colors.teal} />
              <Text className="text-white text-sm">
                Point at a product barcode
              </Text>
            </View>
          </View>
        )}

        {/* Bottom area */}
        <View className="flex-1" pointerEvents="box-none" />

        {/* Loading state */}
        {lookingUp && (
          <View className="px-4 pb-4">
            <Card>
              <CardContent className="py-6 items-center gap-3">
                <ActivityIndicator color={colors.teal} size="large" />
                <Text className="text-sm text-muted-foreground">
                  Looking up product...
                </Text>
              </CardContent>
            </Card>
          </View>
        )}

        {/* Not found state */}
        {isNotFound && !lookingUp && (
          <View className="px-4 pb-4">
            <Card>
              <CardContent className="py-6 items-center gap-4">
                <View
                  className="w-14 h-14 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.mutedForeground + "20" }}
                >
                  <ScanBarcode size={28} color={colors.mutedForeground} />
                </View>
                <Text className="text-base font-semibold text-foreground">
                  Product Not Found
                </Text>
                <Text className="text-sm text-muted-foreground text-center">
                  This barcode is not in our database. You can try scanning
                  again or log the food manually.
                </Text>
                <View className="flex-row gap-3 w-full">
                  <Button
                    variant="outline"
                    onPress={handleScanAnother}
                    className="flex-1"
                  >
                    Try Again
                  </Button>
                  <Button onPress={() => router.back()} className="flex-1">
                    Log Manually
                  </Button>
                </View>
              </CardContent>
            </Card>
          </View>
        )}

        {/* Product found */}
        {product && !lookingUp && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
            <Card>
              <CardContent className="py-4 px-4 gap-4">
                {/* Product info */}
                <View className="flex-row gap-3">
                  {product.thumbnail_url ? (
                    <Image
                      source={{ uri: product.thumbnail_url }}
                      className="w-16 h-16 rounded-lg"
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      className="w-16 h-16 rounded-lg items-center justify-center"
                      style={{ backgroundColor: colors.muted }}
                    >
                      <ScanBarcode size={24} color={colors.mutedForeground} />
                    </View>
                  )}
                  <View className="flex-1">
                    <Text
                      className="text-base font-semibold text-foreground"
                      numberOfLines={2}
                    >
                      {product.food_name}
                    </Text>
                    {product.brand_name && (
                      <Text className="text-sm text-muted-foreground">
                        {product.brand_name}
                      </Text>
                    )}
                    <Text className="text-xs text-muted-foreground mt-1">
                      Per {product.serving_qty}{product.serving_unit}
                    </Text>
                  </View>
                </View>

                {/* Servings input */}
                <View className="flex-row items-center gap-3">
                  <Text className="text-sm text-muted-foreground">Servings:</Text>
                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      onPress={() => setServings(String(Math.max(0.5, qty - 0.5)))}
                      className="w-8 h-8 rounded-full items-center justify-center border border-border"
                    >
                      <Text className="text-foreground text-lg">−</Text>
                    </TouchableOpacity>
                    <TextInput
                      value={servings}
                      onChangeText={setServings}
                      keyboardType="decimal-pad"
                      style={{
                        width: 50,
                        textAlign: 'center',
                        color: colors.foreground,
                        fontSize: 16,
                        fontWeight: 'bold',
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                        paddingVertical: 4,
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => setServings(String(qty + 0.5))}
                      className="w-8 h-8 rounded-full items-center justify-center border border-border"
                    >
                      <Text className="text-foreground text-lg">+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Macros */}
                <View className="flex-row justify-between bg-background rounded-lg px-4 py-3">
                  <View className="items-center">
                    <Text className="text-lg font-bold text-foreground">
                      {Math.round((product.calories ?? 0) * qty)}
                    </Text>
                    <Text className="text-xs text-muted-foreground">kcal</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-lg font-bold text-foreground">
                      {Math.round((product.protein_g ?? 0) * qty)}g
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      Protein
                    </Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-lg font-bold text-foreground">
                      {Math.round((product.carbs_g ?? 0) * qty)}g
                    </Text>
                    <Text className="text-xs text-muted-foreground">Carbs</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-lg font-bold text-foreground">
                      {Math.round((product.fat_g ?? 0) * qty)}g
                    </Text>
                    <Text className="text-xs text-muted-foreground">Fat</Text>
                  </View>
                </View>

                {/* Meal type selector */}
                <View className="flex-row gap-1">
                  {MEAL_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      className={`flex-1 items-center py-2 rounded-lg ${
                        selectedMeal === type
                          ? ""
                          : "bg-card border border-border"
                      }`}
                      style={
                        selectedMeal === type
                          ? { backgroundColor: colors.teal }
                          : undefined
                      }
                      onPress={() => setSelectedMeal(type)}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          selectedMeal === type
                            ? "text-white"
                            : "text-muted-foreground"
                        }`}
                        style={
                          selectedMeal === type
                            ? { color: colors.tealForeground }
                            : undefined
                        }
                      >
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Actions */}
                <View className="flex-row gap-3">
                  <Button
                    variant="outline"
                    onPress={handleScanAnother}
                    className="flex-1"
                  >
                    Scan Another
                  </Button>
                  <Button
                    onPress={handleAddToDiary}
                    loading={logFood.isPending}
                    className="flex-1"
                  >
                    Add to Diary
                  </Button>
                </View>
              </CardContent>
            </Card>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

const OVERLAY_COLOR = "rgba(0,0,0,0.6)";

const styles = StyleSheet.create({
  overlayTop: {
    flex: 1,
    backgroundColor: OVERLAY_COLOR,
  },
  overlayMiddle: {
    flexDirection: "row",
    height: CUTOUT_SIZE * 0.5,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: OVERLAY_COLOR,
  },
  cutout: {
    width: CUTOUT_SIZE,
    height: CUTOUT_SIZE * 0.5,
    borderRadius: 16,
    overflow: "hidden",
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: OVERLAY_COLOR,
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: "#5DE4C7",
    borderWidth: 3,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 16,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 16,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 16,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 16,
  },
});

export default ScanScreen;
