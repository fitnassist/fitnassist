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
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [servingSize, setServingSize] = useState("");

  const updateEntry = trpc.diary.updateFoodEntry.useMutation();
  const deleteEntry = trpc.diary.deleteFoodEntry.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (entry) {
      setCalories(String(entry.calories));
      setProtein(entry.proteinG != null ? String(entry.proteinG) : "");
      setCarbs(entry.carbsG != null ? String(entry.carbsG) : "");
      setFat(entry.fatG != null ? String(entry.fatG) : "");
      setServingSize(entry.servingSize ? String(entry.servingSize) : "1");
    }
  }, [entry]);

  const handleSave = () => {
    if (!entry) return;
    updateEntry.mutate(
      {
        id: entry.id,
        calories: parseInt(calories) || 0,
        proteinG: protein ? parseFloat(protein) : null,
        carbsG: carbs ? parseFloat(carbs) : null,
        fatG: fat ? parseFloat(fat) : null,
        servingSize: parseFloat(servingSize) || 1,
      },
      {
        onSuccess: () => {
          utils.diary.getEntries.invalidate({ date });
          utils.diary.getDailyNutrition.invalidate({ date });
          onClose();
        },
        onError: () =>
          showAlert({ title: "Error", message: "Failed to update entry" }),
      },
    );
  };

  const handleDelete = () => {
    if (!entry) return;
    showAlert({
      title: "Delete Entry",
      message: `Are you sure you want to delete "${entry.name}"?`,
      actions: [
        { label: "Cancel" },
        {
          label: "Delete",
          destructive: true,
          onPress: () => {
            deleteEntry.mutate(
              { id: entry.id },
              {
                onSuccess: () => {
                  utils.diary.getEntries.invalidate({ date });
                  utils.diary.getDailyNutrition.invalidate({ date });
                  onClose();
                },
              },
            );
          },
        },
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
        placeholder="1"
      />
      <Input
        label="Calories"
        value={calories}
        onChangeText={setCalories}
        keyboardType="number-pad"
        placeholder="0"
      />
      <Input
        label="Protein (g)"
        value={protein}
        onChangeText={setProtein}
        keyboardType="decimal-pad"
        placeholder="0"
      />
      <Input
        label="Carbs (g)"
        value={carbs}
        onChangeText={setCarbs}
        keyboardType="decimal-pad"
        placeholder="0"
      />
      <Input
        label="Fat (g)"
        value={fat}
        onChangeText={setFat}
        keyboardType="decimal-pad"
        placeholder="0"
      />
      <Button onPress={handleSave} loading={updateEntry.isPending}>
        Save Changes
      </Button>
      <Button
        variant="outline"
        onPress={handleDelete}
        loading={deleteEntry.isPending}
      >
        <Text style={{ color: "#D94F6B" }}>Delete Entry</Text>
      </Button>
    </LoggerModal>
  );
};
