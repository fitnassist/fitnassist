import { useState } from 'react';
import { View, Alert } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Input, Button } from '@/components/ui';
import { LoggerModal } from './LoggerModal';
import { trpc } from '@/lib/trpc';

const ACTIVITY_TYPES = ['RUN', 'WALK', 'CYCLE', 'SWIM', 'HIKE', 'OTHER'] as const;

interface ActivityLoggerProps {
  visible: boolean;
  onClose: () => void;
  date: string;
}

export const ActivityLogger = ({ visible, onClose, date }: ActivityLoggerProps) => {
  const [activityType, setActivityType] = useState<string>('RUN');
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');
  const logActivity = trpc.diary.logActivity.useMutation();
  const utils = trpc.useUtils();

  const handleSubmit = () => {
    const dur = parseInt(duration);
    if (isNaN(dur) || dur <= 0) {
      Alert.alert('Error', 'Please enter a duration');
      return;
    }
    logActivity.mutate(
      {
        date,
        activityType: activityType as any,
        durationMinutes: dur,
        distanceKm: distance ? parseFloat(distance) : undefined,
        caloriesBurned: calories ? parseInt(calories) : undefined,
        notes: notes || undefined,
      } as any,
      {
        onSuccess: () => {
          utils.diary.getEntries.invalidate({ date });
          setDuration('');
          setDistance('');
          setCalories('');
          setNotes('');
          onClose();
        },
        onError: () => Alert.alert('Error', 'Failed to log activity'),
      },
    );
  };

  return (
    <LoggerModal visible={visible} onClose={onClose} title="Log Activity">
      <Text className="text-sm font-medium text-foreground">Activity Type</Text>
      <View className="flex-row flex-wrap gap-2">
        {ACTIVITY_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            className={`px-3 py-2 rounded-lg border ${activityType === type ? 'border-teal bg-teal/10' : 'border-border'}`}
            onPress={() => setActivityType(type)}
          >
            <Text className={`text-xs font-medium ${activityType === type ? 'text-primary' : 'text-muted-foreground'}`}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Input label="Duration (minutes)" value={duration} onChangeText={setDuration} keyboardType="number-pad" placeholder="e.g. 30" />
      <Input label="Distance (km, optional)" value={distance} onChangeText={setDistance} keyboardType="decimal-pad" placeholder="e.g. 5.0" />
      <Input label="Calories Burned (optional)" value={calories} onChangeText={setCalories} keyboardType="number-pad" placeholder="e.g. 300" />
      <Input label="Notes (optional)" value={notes} onChangeText={setNotes} multiline />
      <Button onPress={handleSubmit} loading={logActivity.isPending}>Save</Button>
    </LoggerModal>
  );
};
