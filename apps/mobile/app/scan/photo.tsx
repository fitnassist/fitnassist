import { useState } from "react";
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import {
  X,
  Camera,
  ImageIcon,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react-native";
import { Text, Button, Card, CardContent, useAlert } from "@/components/ui";
import { trpc } from "@/lib/trpc";
import { colors } from "@/constants/theme";

const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;

const CONFIDENCE_COLORS: Record<string, { bg: string; text: string }> = {
  high: { bg: "#22c55e20", text: "#22c55e" },
  medium: { bg: "#f59e0b20", text: "#f59e0b" },
  low: { bg: "#ef444420", text: "#ef4444" },
};

interface RecognizedFood {
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  servingSize: string;
  confidence: "high" | "medium" | "low";
}

const pickImage = async (useCamera: boolean) => {
  const fn = useCamera
    ? ImagePicker.launchCameraAsync
    : ImagePicker.launchImageLibraryAsync;
  const result = await fn({
    mediaTypes: ["images"],
    quality: 0.5,
    base64: false,
  });
  if (!result.canceled && result.assets[0]?.uri) {
    // Resize and compress for API upload
    const { ImageManipulator } = await import("expo-image-manipulator");
    const ref = ImageManipulator.manipulate(result.assets[0].uri);
    const resized = await ref.resize({ width: 800 }).renderAsync();
    const base64Result = await resized.saveAsync({
      format: "jpeg" as any,
      compress: 0.5,
      base64: true,
    });
    if (base64Result.base64) {
      return {
        base64: base64Result.base64,
        uri: base64Result.uri,
      };
    }
  }
  return null;
};

const PhotoScanScreen = () => {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [results, setResults] = useState<RecognizedFood[] | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [selectedMeal, setSelectedMeal] = useState<string>("BREAKFAST");
  const utils = trpc.useUtils();

  const recognizeFood = trpc.diary.recognizeFood.useMutation();
  const logFood = trpc.diary.logFood.useMutation();

  const today = new Date().toISOString().split("T")[0]!;

  const handlePickImage = async (useCamera: boolean) => {
    const result = await pickImage(useCamera);
    if (!result) return;

    setImageUri(result.uri);
    setImageBase64(result.base64);
    setResults(null);
    setSelectedItems(new Set());

    recognizeFood.mutate(
      { imageBase64: result.base64 },
      {
        onSuccess: (data) => {
          setResults(data);
          setSelectedItems(
            new Set(data.map((_: RecognizedFood, i: number) => i)),
          );
        },
        onError: () => {
          showAlert({
            title: "Recognition Failed",
            message:
              "Could not analyse the image. Please try again with a clearer photo.",
          });
        },
      },
    );
  };

  const handleRetake = () => {
    setImageUri(null);
    setImageBase64(null);
    setResults(null);
    setSelectedItems(new Set());
  };

  const toggleItem = (index: number) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleAddToDiary = () => {
    if (!results) return;

    const items = results
      .filter((_: RecognizedFood, i: number) => selectedItems.has(i))
      .map((food: RecognizedFood) => ({
        name: food.name,
        mealType: selectedMeal as "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK",
        calories: Math.round(food.calories),
        proteinG: Math.round(food.proteinG * 10) / 10,
        carbsG: Math.round(food.carbsG * 10) / 10,
        fatG: Math.round(food.fatG * 10) / 10,
      }));

    if (items.length === 0) {
      showAlert({
        title: "No Items Selected",
        message: "Please select at least one food item to add.",
      });
      return;
    }

    logFood.mutate(
      { date: today, items },
      {
        onSuccess: () => {
          utils.diary.getEntries.invalidate({ date: today });
          utils.diary.getDailyNutrition.invalidate({ date: today });
          router.back();
        },
        onError: () => {
          showAlert({
            title: "Error",
            message: "Failed to add food to diary. Please try again.",
          });
        },
      },
    );
  };

  const selectedTotal = results
    ? results
        .filter((_: RecognizedFood, i: number) => selectedItems.has(i))
        .reduce(
          (
            acc: {
              calories: number;
              proteinG: number;
              carbsG: number;
              fatG: number;
            },
            food: RecognizedFood,
          ) => ({
            calories: acc.calories + food.calories,
            proteinG: acc.proteinG + food.proteinG,
            carbsG: acc.carbsG + food.carbsG,
            fatG: acc.fatG + food.fatG,
          }),
          { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
        )
    : null;

  // Choice screen — no image selected yet
  if (!imageUri) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-4 pt-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-card items-center justify-center"
          >
            <X size={22} color="#F2F2F2" />
          </TouchableOpacity>
          <Text className="text-base font-semibold text-foreground">
            AI Food Scanner
          </Text>
          <View className="w-10" />
        </View>

        <View className="flex-1 items-center justify-center px-6 gap-6">
          <View
            className="w-20 h-20 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.teal + "20" }}
          >
            <Sparkles size={40} color="#ffffff" />
          </View>
          <Text className="text-lg font-semibold text-foreground text-center">
            Snap your meal
          </Text>
          <Text className="text-sm text-muted-foreground text-center leading-5">
            Take a photo or pick one from your gallery and our AI will identify
            the food items and estimate nutritional values.
          </Text>

          <View className="w-full gap-3">
            <TouchableOpacity
              className="flex-row items-center gap-4 p-4 rounded-xl border border-border"
              style={{ backgroundColor: colors.card }}
              onPress={() => handlePickImage(true)}
            >
              <View
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.coral + "20" }}
              >
                <Camera size={24} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-foreground">
                  Take Photo
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Use your camera to snap a photo
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center gap-4 p-4 rounded-xl border border-border"
              style={{ backgroundColor: colors.card }}
              onPress={() => handlePickImage(false)}
            >
              <View
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.teal + "20" }}
              >
                <ImageIcon size={24} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-foreground">
                  Choose from Gallery
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Pick an existing photo
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Image selected — show preview + results
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 pt-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-card items-center justify-center"
        >
          <X size={22} color="#F2F2F2" />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">
          AI Food Scanner
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-8 gap-4 pt-4"
      >
        {/* Image Preview */}
        <View className="rounded-xl overflow-hidden border border-border">
          <Image
            source={{ uri: imageUri }}
            className="w-full h-48"
            resizeMode="cover"
          />
          {recognizeFood.isPending && (
            <View className="absolute inset-0 bg-black/60 items-center justify-center gap-3">
              <ActivityIndicator color="#ffffff" size="large" />
              <Text className="text-white text-sm font-medium">
                Analysing your meal...
              </Text>
            </View>
          )}
        </View>

        {/* Error state */}
        {recognizeFood.isError && (
          <Card>
            <CardContent className="py-4 items-center gap-3">
              <Text className="text-sm text-muted-foreground text-center">
                Could not recognise food items. Try a clearer photo.
              </Text>
              <Button variant="outline" onPress={handleRetake}>
                Retake Photo
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {results && results.length === 0 && (
          <Card>
            <CardContent className="py-4 items-center gap-3">
              <Text className="text-sm text-muted-foreground text-center">
                No food items were detected in this image. Try a different
                photo.
              </Text>
              <Button variant="outline" onPress={handleRetake}>
                Retake Photo
              </Button>
            </CardContent>
          </Card>
        )}

        {results && results.length > 0 && (
          <>
            {/* Disclaimer */}
            <View className="bg-card border border-border rounded-lg px-3 py-2">
              <Text className="text-xs text-muted-foreground text-center">
                Nutritional values are AI estimates — adjust as needed
              </Text>
            </View>

            {/* Food items */}
            {results.map((food: RecognizedFood, index: number) => {
              const isSelected = selectedItems.has(index);
              const conf = CONFIDENCE_COLORS[food.confidence];

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => toggleItem(index)}
                  activeOpacity={0.7}
                >
                  <Card>
                    <CardContent className="py-3 px-4">
                      <View className="flex-row items-start gap-3">
                        {/* Checkbox */}
                        <View
                          className="w-6 h-6 rounded-md items-center justify-center mt-0.5"
                          style={{
                            backgroundColor: isSelected
                              ? colors.teal
                              : "transparent",
                            borderWidth: isSelected ? 0 : 2,
                            borderColor: colors.border,
                          }}
                        >
                          {isSelected && <Check size={14} color="#ffffff" />}
                        </View>

                        <View className="flex-1">
                          {/* Name + confidence */}
                          <View className="flex-row items-center gap-2 mb-1">
                            <Text
                              className="text-sm font-semibold text-foreground flex-1"
                              numberOfLines={1}
                            >
                              {food.name}
                            </Text>
                            <View
                              className="px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: conf?.bg }}
                            >
                              <Text
                                className="text-[10px] font-medium capitalize"
                                style={{ color: conf?.text }}
                              >
                                {food.confidence}
                              </Text>
                            </View>
                          </View>

                          {/* Serving size */}
                          <Text className="text-xs text-muted-foreground mb-2">
                            {food.servingSize}
                          </Text>

                          {/* Macros row */}
                          <View className="flex-row justify-between bg-background rounded-lg px-3 py-2">
                            <View className="items-center">
                              <Text className="text-sm font-bold text-foreground">
                                {Math.round(food.calories)}
                              </Text>
                              <Text className="text-[10px] text-muted-foreground">
                                kcal
                              </Text>
                            </View>
                            <View className="items-center">
                              <Text className="text-sm font-bold text-foreground">
                                {Math.round(food.proteinG)}g
                              </Text>
                              <Text className="text-[10px] text-muted-foreground">
                                Protein
                              </Text>
                            </View>
                            <View className="items-center">
                              <Text className="text-sm font-bold text-foreground">
                                {Math.round(food.carbsG)}g
                              </Text>
                              <Text className="text-[10px] text-muted-foreground">
                                Carbs
                              </Text>
                            </View>
                            <View className="items-center">
                              <Text className="text-sm font-bold text-foreground">
                                {Math.round(food.fatG)}g
                              </Text>
                              <Text className="text-[10px] text-muted-foreground">
                                Fat
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </CardContent>
                  </Card>
                </TouchableOpacity>
              );
            })}

            {/* Selected totals */}
            {selectedTotal && selectedItems.size > 0 && (
              <View className="flex-row justify-between bg-card border border-border rounded-lg px-4 py-3">
                <View className="items-center">
                  <Text className="text-lg font-bold text-foreground">
                    {Math.round(selectedTotal.calories)}
                  </Text>
                  <Text className="text-xs text-muted-foreground">kcal</Text>
                </View>
                <View className="items-center">
                  <Text className="text-lg font-bold text-foreground">
                    {Math.round(selectedTotal.proteinG)}g
                  </Text>
                  <Text className="text-xs text-muted-foreground">Protein</Text>
                </View>
                <View className="items-center">
                  <Text className="text-lg font-bold text-foreground">
                    {Math.round(selectedTotal.carbsG)}g
                  </Text>
                  <Text className="text-xs text-muted-foreground">Carbs</Text>
                </View>
                <View className="items-center">
                  <Text className="text-lg font-bold text-foreground">
                    {Math.round(selectedTotal.fatG)}g
                  </Text>
                  <Text className="text-xs text-muted-foreground">Fat</Text>
                </View>
              </View>
            )}

            {/* Meal type selector */}
            <View className="flex-row gap-1">
              {MEAL_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  className={`flex-1 items-center py-2 rounded-lg ${
                    selectedMeal === type ? "" : "bg-card border border-border"
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
                onPress={handleRetake}
                className="flex-1"
              >
                <View className="flex-row items-center gap-2">
                  <RotateCcw size={14} color="#F2F2F2" />
                  <Text className="text-sm font-semibold text-foreground">
                    Retake
                  </Text>
                </View>
              </Button>
              <Button
                onPress={handleAddToDiary}
                loading={logFood.isPending}
                className="flex-1"
              >
                Add to Diary
              </Button>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default PhotoScanScreen;
