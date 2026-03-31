import { useState } from 'react';
import { View } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Input, Button, useAlert } from '@/components/ui';
import { LoggerModal } from './LoggerModal';
import { trpc } from '@/lib/trpc';
import { colors } from '@/constants/theme';

const PRESETS = [250, 500, 750, 1000];

interface WaterLoggerProps {
  visible: boolean;
  onClose: () => void;
  date: string;
}

export const WaterLogger = ({ visible, onClose, date }: WaterLoggerProps) => {
  const { showAlert } = useAlert();
  const [amount, setAmount] = useState('');
  const logWater = trpc.diary.logWater.useMutation();
  const utils = trpc.useUtils();

  const handleSubmit = (ml?: number) => {
    const val = ml ?? parseInt(amount);
    if (isNaN(val) || val <= 0) {
      showAlert({ title: 'Error', message: 'Please enter a valid amount' });
      return;
    }
    logWater.mutate(
      { date, totalMl: val },
      {
        onSuccess: () => {
          utils.diary.getEntries.invalidate({ date });
          utils.diary.getDailyNutrition.invalidate({ date });
          setAmount('');
          onClose();
        },
        onError: () => showAlert({ title: 'Error', message: 'Failed to log water' }),
      },
    );
  };

  return (
    <LoggerModal visible={visible} onClose={onClose} title="Log Water">
      <View className="flex-row flex-wrap gap-2">
        {PRESETS.map((ml) => (
          <TouchableOpacity
            key={ml}
            className="bg-teal/20 rounded-lg px-4 py-3"
            onPress={() => handleSubmit(ml)}
          >
            <Text className="text-sm font-semibold text-teal">{ml}ml</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Input
        label="Custom amount (ml)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="number-pad"
        placeholder="e.g. 330"
      />
      <Button onPress={() => handleSubmit()} loading={logWater.isPending}>Save</Button>
    </LoggerModal>
  );
};
