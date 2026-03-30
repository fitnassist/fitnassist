import { useState } from 'react';
import { Alert } from 'react-native';
import { Input, Button } from '@/components/ui';
import { LoggerModal } from './LoggerModal';
import { trpc } from '@/lib/trpc';

interface WorkoutLoggerProps {
  visible: boolean;
  onClose: () => void;
  date: string;
}

export const WorkoutLogger = ({ visible, onClose, date }: WorkoutLoggerProps) => {
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');
  const logWorkout = trpc.diary.logWorkout.useMutation();
  const utils = trpc.useUtils();

  const handleSubmit = () => {
    const dur = parseInt(duration);
    if (isNaN(dur) || dur <= 0) {
      Alert.alert('Error', 'Please enter a duration');
      return;
    }
    logWorkout.mutate(
      {
        date,
        durationMinutes: dur,
        caloriesBurned: calories ? parseInt(calories) : undefined,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          utils.diary.getEntries.invalidate({ date });
          setDuration('');
          setCalories('');
          setNotes('');
          onClose();
        },
        onError: () => Alert.alert('Error', 'Failed to log workout'),
      },
    );
  };

  return (
    <LoggerModal visible={visible} onClose={onClose} title="Log Workout">
      <Input
        label="Duration (minutes)"
        value={duration}
        onChangeText={setDuration}
        keyboardType="number-pad"
        placeholder="e.g. 45"
      />
      <Input
        label="Calories Burned (optional)"
        value={calories}
        onChangeText={setCalories}
        keyboardType="number-pad"
        placeholder="e.g. 350"
      />
      <Input
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        multiline
        placeholder="What did you do?"
      />
      <Button onPress={handleSubmit} loading={logWorkout.isPending}>Save</Button>
    </LoggerModal>
  );
};
