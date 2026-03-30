import { useState } from 'react';
import { View, Alert, FlatList } from 'react-native';
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
    setName(food.name ?? food.description ?? '');
    setCalories(String(Math.round(food.calories ?? food.energy ?? 0)));
    setProtein(String(Math.round(food.protein ?? 0)));
    setCarbs(String(Math.round(food.carbs ?? food.carbohydrates ?? 0)));
    setFat(String(Math.round(food.fat ?? 0)));
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
          <View className="flex-row items-center bg-card border border-border rounded-lg px-3">
            <Search size={18} color={colors.mutedForeground} />
            <View className="flex-1">
              <Input
                value={query}
                onChangeText={setQuery}
                placeholder="Search foods..."
                className="border-0"
              />
            </View>
          </View>

          {searching && <Skeleton className="h-20 rounded-lg" />}

          {searchResults && ((searchResults as any)?.results ?? searchResults as any)?.length > 0 && (
            <View className="gap-1 max-h-48">
              {((searchResults as any)?.results ?? searchResults as any).slice(0, 8).map((food: any, i: number) => (
                <TouchableOpacity
                  key={i}
                  className="bg-card border border-border rounded-lg px-3 py-2"
                  onPress={() => handleSelectFood(food)}
                >
                  <Text className="text-sm text-foreground" numberOfLines={1}>{food.name ?? food.description}</Text>
                  <Text className="text-xs text-muted-foreground">
                    {Math.round(food.calories ?? food.energy ?? 0)} kcal
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
