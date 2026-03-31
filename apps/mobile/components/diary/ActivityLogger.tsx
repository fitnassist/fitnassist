import { useState } from 'react';
import { Text, Input, Button, PillSelect, useAlert } from '@/components/ui';
import { LoggerModal } from './LoggerModal';
import { trpc } from '@/lib/trpc';

const ACTIVITY_TYPES = ['RUN', 'WALK', 'CYCLE', 'SWIM', 'HIKE', 'OTHER'] as const;

interface ActivityLoggerProps {
  visible: boolean;
  onClose: () => void;
  date: string;
}

export const ActivityLogger = ({ visible, onClose, date }: ActivityLoggerProps) => {
  const { showAlert } = useAlert();
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
      showAlert({ title: 'Error', message: 'Please enter a duration' });
      return;
    }
    logActivity.mutate(
      {
        date,
        activityType: activityType as any,
        durationSeconds: dur * 60,
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
        onError: () => showAlert({ title: 'Error', message: 'Failed to log activity' }),
      },
    );
  };

  return (
    <LoggerModal visible={visible} onClose={onClose} title="Log Activity">
      <Text className="text-sm font-medium text-foreground">Activity Type</Text>
      <PillSelect options={[...ACTIVITY_TYPES]} value={activityType} onChange={setActivityType} />
      <Input label="Duration (minutes)" value={duration} onChangeText={setDuration} keyboardType="number-pad" placeholder="e.g. 30" />
      <Input label="Distance (km, optional)" value={distance} onChangeText={setDistance} keyboardType="decimal-pad" placeholder="e.g. 5.0" />
      <Input label="Calories Burned (optional)" value={calories} onChangeText={setCalories} keyboardType="number-pad" placeholder="e.g. 300" />
      <Input label="Notes (optional)" value={notes} onChangeText={setNotes} multiline />
      <Button onPress={handleSubmit} loading={logActivity.isPending}>Save</Button>
    </LoggerModal>
  );
};
