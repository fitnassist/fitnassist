import { useState } from 'react';
import { View, Alert, ScrollView, TextInput as RNTextInput } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { Search } from 'lucide-react-native';
import { Text, Input, Button, Skeleton } from '@/components/ui';
import { LoggerModal } from './LoggerModal';
import { trpc } from '@/lib/trpc';
import { colors } from '@/constants/theme';

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const;

interface FoodLoggerProps {
  visible: boolean;
  onClose: () => void;
  date: string;
}

export const FoodLogger = ({ visible, onClose, date }: FoodLoggerProps) => {
  const [mealType, setMealType] = useState<string>('BREAKFAST');
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [servingSize, setServingSize] = useState('1');
  const [mode, setMode] = useState<'search' | 'manual'>('search');

  const { data: searchResults, isLoading: searching } = trpc.diary.searchFood.useQuery(
    { query },
    { enabled: query.length >= 2 },
  );

  const logFood = trpc.diary.logFood.useMutation();
  const utils = trpc.useUtils();

  const handleSelectFood = (food: any) => {
    setName(food.food_name ?? '');
    setCalories(String(food.calories ?? 0));
    setProtein(String(food.protein_g ?? 0));
    setCarbs(String(food.carbs_g ?? 0));
    setFat(String(food.fat_g ?? 0));
    setServingSize(String(food.serving_qty ?? 1));
    setMode('manual');
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a food name');
      return;
    }
    logFood.mutate(
      {
        date,
        items: [{
          name,
          mealType: mealType as any,
          calories: parseInt(calories) || 0,
          proteinG: parseFloat(protein) || 0,
          carbsG: parseFloat(carbs) || 0,
          fatG: parseFloat(fat) || 0,
        }],
      },
      {
        onSuccess: () => {
          utils.diary.getEntries.invalidate({ date });
          utils.diary.getDailyNutrition.invalidate({ date });
          setName('');
          setCalories('');
          setProtein('');
          setCarbs('');
          setFat('');
          setQuery('');
          setMode('search');
          onClose();
        },
        onError: () => Alert.alert('Error', 'Failed to log food'),
      },
    );
  };

  return (
    <LoggerModal visible={visible} onClose={onClose} title="Log Food">
      {/* Meal type */}
      <View className="flex-row gap-1">
        {MEAL_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            className={`flex-1 items-center py-2 rounded-lg ${mealType === type ? 'bg-primary' : 'bg-card border border-border'}`}
            onPress={() => setMealType(type)}
          >
            <Text className={`text-xs font-medium ${mealType === type ? 'text-white' : 'text-muted-foreground'}`}>
              {type.charAt(0) + type.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode === 'search' ? (
        <>
          {/* Search */}
          <View className="flex-row items-center h-12 bg-card border border-border rounded-lg px-3">
            <Search size={18} color={colors.mutedForeground} />
            <RNTextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search foods..."
              placeholderTextColor="hsl(230, 10%, 55%)"
              className="flex-1 text-foreground ml-2"
              style={{ fontSize: 16, padding: 0, margin: 0 }}
              autoCapitalize="none"
            />
          </View>

          {searching && <Skeleton className="h-20 rounded-lg" />}

          {searchResults && (searchResults as any)?.products?.length > 0 && (
            <ScrollView className="max-h-64 bg-card border border-border rounded-lg" keyboardShouldPersistTaps="handled">
              {(searchResults as any).products.slice(0, 15).map((food: any, i: number) => (
                <TouchableOpacity
                  key={i}
                  className="px-4 py-3 border-b border-border"
                  onPress={() => handleSelectFood(food)}
                >
                  <Text className="text-sm text-foreground" numberOfLines={1}>{food.food_name}{food.brand_name ? ` (${food.brand_name})` : ''}</Text>
                  <Text className="text-xs text-muted-foreground">
                    {food.calories} kcal · {food.serving_qty}{food.serving_unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <Button variant="outline" onPress={() => setMode('manual')}>
            Enter Manually
          </Button>
        </>
      ) : (
        <>
          {/* Manual entry */}
          <Input label="Food Name" value={name} onChangeText={setName} placeholder="e.g. Chicken Breast" />
          <Input label="Serving Size" value={servingSize} onChangeText={setServingSize} keyboardType="decimal-pad" />
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Input label="Calories" value={calories} onChangeText={setCalories} keyboardType="number-pad" />
            </View>
            <View className="flex-1">
              <Input label="Protein (g)" value={protein} onChangeText={setProtein} keyboardType="decimal-pad" />
            </View>
          </View>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Input label="Carbs (g)" value={carbs} onChangeText={setCarbs} keyboardType="decimal-pad" />
            </View>
            <View className="flex-1">
              <Input label="Fat (g)" value={fat} onChangeText={setFat} keyboardType="decimal-pad" />
            </View>
          </View>

          <View className="flex-row gap-2">
            <Button variant="outline" onPress={() => setMode('search')} className="flex-1">Back to Search</Button>
            <Button onPress={handleSubmit} loading={logFood.isPending} className="flex-1">Save</Button>
          </View>
        </>
      )}
    </LoggerModal>
  );
};
