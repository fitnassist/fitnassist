import { useState } from 'react';
import { Text, Input, Button, PillSelect, useAlert } from '@/components/ui';
import { LoggerModal } from './LoggerModal';
import { trpc } from '@/lib/trpc';

const QUALITY_OPTIONS = [
  { value: '1', label: 'Terrible' },
  { value: '2', label: 'Poor' },
  { value: '3', label: 'Fair' },
  { value: '4', label: 'Good' },
  { value: '5', label: 'Excellent' },
];

interface SleepLoggerProps {
  visible: boolean;
  onClose: () => void;
  date: string;
}

export const SleepLogger = ({ visible, onClose, date }: SleepLoggerProps) => {
  const { showAlert } = useAlert();
  const [hours, setHours] = useState('');
  const [quality, setQuality] = useState('');
  const logSleep = trpc.diary.logSleep.useMutation();
  const utils = trpc.useUtils();

  const handleSubmit = () => {
    const val = parseFloat(hours);
    if (isNaN(val) || val <= 0) {
      showAlert({ title: 'Error', message: 'Please enter hours slept' });
      return;
    }
    logSleep.mutate(
      { date, hoursSlept: val, quality: quality ? parseInt(quality) : 3 },
      {
        onSuccess: () => {
          utils.diary.getEntries.invalidate({ date });
          setHours('');
          setQuality('');
          onClose();
        },
        onError: () => showAlert({ title: 'Error', message: 'Failed to log sleep' }),
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
      <PillSelect options={QUALITY_OPTIONS} value={quality} onChange={setQuality} />
      <Button onPress={handleSubmit} loading={logSleep.isPending}>Save</Button>
    </LoggerModal>
  );
};
