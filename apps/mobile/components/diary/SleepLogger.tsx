import { useState } from 'react';
import { View, Alert } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Input, Button } from '@/components/ui';
import { LoggerModal } from './LoggerModal';
import { trpc } from '@/lib/trpc';
import { colors } from '@/constants/theme';

const QUALITY_OPTIONS = [
  { value: 1, label: 'Terrible' },
  { value: 2, label: 'Poor' },
  { value: 3, label: 'Fair' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Excellent' },
];

interface SleepLoggerProps {
  visible: boolean;
  onClose: () => void;
  date: string;
}

export const SleepLogger = ({ visible, onClose, date }: SleepLoggerProps) => {
  const [hours, setHours] = useState('');
  const [quality, setQuality] = useState(0);
  const logSleep = trpc.diary.logSleep.useMutation();
  const utils = trpc.useUtils();

  const handleSubmit = () => {
    const val = parseFloat(hours);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Error', 'Please enter hours slept');
      return;
    }
    logSleep.mutate(
      { date, hoursSlept: val, quality: quality > 0 ? quality : 3 },
      {
        onSuccess: () => {
          utils.diary.getEntries.invalidate({ date });
          setHours('');
          setQuality(0);
          onClose();
        },
        onError: () => Alert.alert('Error', 'Failed to log sleep'),
      },
    );
  };

  return (
    <LoggerModal visible={visible} onClose={onClose} title="Log Sleep">
      <Input
        label="Hours Slept"
        value={hours}
        onChangeText={setHours}
        keyboardType="decimal-pad"
        placeholder="e.g. 7.5"
      />
      <Text className="text-sm font-medium text-foreground">Sleep Quality</Text>
      <View className="flex-row gap-2">
        {QUALITY_OPTIONS.map(({ value, label }) => (
          <TouchableOpacity
            key={value}
            className={`flex-1 items-center py-2 rounded-lg border ${
              quality === value ? 'border-teal bg-teal/10' : 'border-border'
            }`}
            onPress={() => setQuality(value)}
          >
            <Text className={`text-xs font-medium ${quality === value ? 'text-primary' : 'text-muted-foreground'}`}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Button onPress={handleSubmit} loading={logSleep.isPending}>Save</Button>
    </LoggerModal>
  );
};
