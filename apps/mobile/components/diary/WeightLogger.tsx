import { useState } from 'react';
import { Alert } from 'react-native';
import { Input, Button } from '@/components/ui';
import { LoggerModal } from './LoggerModal';
import { trpc } from '@/lib/trpc';

interface WeightLoggerProps {
  visible: boolean;
  onClose: () => void;
  date: string;
}

export const WeightLogger = ({ visible, onClose, date }: WeightLoggerProps) => {
  const [weight, setWeight] = useState('');
  const logWeight = trpc.diary.logWeight.useMutation();
  const utils = trpc.useUtils();

  const handleSubmit = () => {
    const val = parseFloat(weight);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Error', 'Please enter a valid weight');
      return;
    }
    logWeight.mutate(
      { date, weightKg: val },
      {
        onSuccess: () => {
          utils.diary.getEntries.invalidate({ date });
          setWeight('');
          onClose();
        },
        onError: () => Alert.alert('Error', 'Failed to log weight'),
      },
    );
  };

  return (
    <LoggerModal visible={visible} onClose={onClose} title="Log Weight">
      <Input
        label="Weight (kg)"
        value={weight}
        onChangeText={setWeight}
        keyboardType="decimal-pad"
        placeholder="e.g. 75.5"
      />
      <Button onPress={handleSubmit} loading={logWeight.isPending}>Save</Button>
    </LoggerModal>
  );
};
