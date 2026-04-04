import { useState, useEffect } from "react";
import { View } from "react-native";
import { Text, Input, Button, useAlert } from "@/components/ui";
import { LoggerModal } from "./LoggerModal";
import { trpc } from "@/lib/trpc";

interface EditFoodModalProps {
  visible: boolean;
  onClose: () => void;
  entry: {
    id: string;
    name: string;
    calories: number;
    proteinG?: number | null;
    carbsG?: number | null;
    fatG?: number | null;
    servingSize?: number;
    servingUnit?: string;
  } | null;
  date: string;
}

export const EditFoodModal = ({
  visible,
  onClose,
  entry,
  date,
}: EditFoodModalProps) => {
  const { showAlert } = useAlert();
  const [servingSize, setServingSize] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const utils = trpc.useUtils();
  const updateEntry = trpc.diary.updateFoodEntry.useMutation();
  const deleteEntry = trpc.diary.deleteFoodEntry.useMutation();

  useEffect(() => {
    if (entry) {
      setServingSize(String(entry.servingSize ?? 1));
      setCalories(String(entry.calories ?? 0));
      setProtein(String(entry.proteinG ?? ""));
      setCarbs(String(entry.carbsG ?? ""));
      setFat(String(entry.fatG ?? ""));
    }
  }, [entry]);

  const handleSave = () => {
    if (!entry) return;
    updateEntry.mutate(
      {
        id: entry.id,
        servingSize: parseFloat(servingSize) || undefined,
        calories: parseInt(calories) || undefined,
        proteinG: protein ? parseFloat(protein) : null,
        carbsG: carbs ? parseFloat(carbs) : null,
        fatG: fat ? parseFloat(fat) : null,
      },
      {
        onSuccess: () => {
          utils.diary.getEntries.invalidate({ date });
          utils.diary.getDailyNutrition.invalidate({ date });
          onClose();
        },
        onError: () =>
          showAlert({ title: "Error", message: "Failed to update food entry" }),
      },
    );
  };

  const handleDelete = () => {
    if (!entry) return;
    showAlert({
      title: "Delete Food Entry",
      message: `Are you sure you want to delete "${entry.name}"?`,
      actions: [
        {
          label: "Delete",
          variant: "destructive",
          onPress: () =>
            deleteEntry.mutate(
              { id: entry.id },
              {
                onSuccess: () => {
                  utils.diary.getEntries.invalidate({ date });
                  utils.diary.getDailyNutrition.invalidate({ date });
                  onClose();
                },
                onError: () =>
                  showAlert({
                    title: "Error",
                    message: "Failed to delete food entry",
                  }),
              },
            ),
        },
        { label: "Cancel", variant: "outline" },
      ],
    });
  };

  return (
    <LoggerModal
      visible={visible}
      onClose={onClose}
      title={entry?.name ?? "Edit Food"}
    >
      <Input
        label="Serving Size"
        value={servingSize}
        onChangeText={setServingSize}
        keyboardType="decimal-pad"
      />
      <Input
        label="Calories"
        value={calories}
        onChangeText={setCalories}
        keyboardType="number-pad"
      />
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Input
            label="Protein (g)"
            value={protein}
            onChangeText={setProtein}
            keyboardType="decimal-pad"
          />
        </View>
        <View className="flex-1">
          <Input
            label="Carbs (g)"
            value={carbs}
            onChangeText={setCarbs}
            keyboardType="decimal-pad"
          />
        </View>
      </View>
      <Input
        label="Fat (g)"
        value={fat}
        onChangeText={setFat}
        keyboardType="decimal-pad"
      />

      <View className="flex-row gap-2">
        <Button
          variant="destructive"
          onPress={handleDelete}
          loading={deleteEntry.isPending}
          className="flex-1"
        >
          Delete
        </Button>
        <Button
          onPress={handleSave}
          loading={updateEntry.isPending}
          className="flex-1"
        >
          Save
        </Button>
      </View>
    </LoggerModal>
  );
};
