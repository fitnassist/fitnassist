import { useState } from 'react';
import { View, Alert } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Input, Button } from '@/components/ui';
import { LoggerModal } from './LoggerModal';
import { trpc } from '@/lib/trpc';

const PRESETS = [1000, 2500, 5000, 7500, 10000];

interface StepsLoggerProps {
  visible: boolean;
  onClose: () => void;
  date: string;
}

export const StepsLogger = ({ visible, onClose, date }: StepsLoggerProps) => {
  const [steps, setSteps] = useState('');
  const logSteps = trpc.diary.logSteps.useMutation();
  const utils = trpc.useUtils();

  const handleSubmit = (preset?: number) => {
    const val = preset ?? parseInt(steps);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Error', 'Please enter a valid step count');
      return;
    }
    logSteps.mutate(
      { date, totalSteps: val },
      {
        onSuccess: () => {
          utils.diary.getEntries.invalidate({ date });
          setSteps('');
          onClose();
        },
        onError: () => Alert.alert('Error', 'Failed to log steps'),
      },
    );
  };

  return (
    <LoggerModal visible={visible} onClose={onClose} title="Log Steps">
      <View className="flex-row flex-wrap gap-2">
        {PRESETS.map((n) => (
          <TouchableOpacity
            key={n}
            className="bg-teal/20 rounded-lg px-4 py-3"
            onPress={() => handleSubmit(n)}
          >
            <Text className="text-sm font-semibold text-teal">{n.toLocaleString()}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Input
        label="Custom step count"
        value={steps}
        onChangeText={setSteps}
        keyboardType="number-pad"
        placeholder="e.g. 8432"
      />
      <Button onPress={() => handleSubmit()} loading={logSteps.isPending}>Save</Button>
    </LoggerModal>
  );
};
