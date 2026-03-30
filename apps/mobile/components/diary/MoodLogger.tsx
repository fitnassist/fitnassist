import { useState } from 'react';
import { View, Alert } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Input, Button } from '@/components/ui';
import { LoggerModal } from './LoggerModal';
import { trpc } from '@/lib/trpc';

const MOODS = [
  { value: 'TERRIBLE', emoji: '😢', label: 'Terrible' },
  { value: 'BAD', emoji: '😞', label: 'Bad' },
  { value: 'OKAY', emoji: '😐', label: 'Okay' },
  { value: 'GOOD', emoji: '😊', label: 'Good' },
  { value: 'GREAT', emoji: '😄', label: 'Great' },
];

interface MoodLoggerProps {
  visible: boolean;
  onClose: () => void;
  date: string;
}

export const MoodLogger = ({ visible, onClose, date }: MoodLoggerProps) => {
  const [mood, setMood] = useState('');
  const [notes, setNotes] = useState('');
  const logMood = trpc.diary.logMood.useMutation();
  const utils = trpc.useUtils();

  const handleSubmit = () => {
    if (!mood) {
      Alert.alert('Error', 'Please select a mood');
      return;
    }
    logMood.mutate(
      { date, level: mood as any, notes: notes || undefined },
      {
        onSuccess: () => {
          utils.diary.getEntries.invalidate({ date });
          setMood('');
          setNotes('');
          onClose();
        },
        onError: () => Alert.alert('Error', 'Failed to log mood'),
      },
    );
  };

  return (
    <LoggerModal visible={visible} onClose={onClose} title="Log Mood">
      <View className="flex-row justify-between">
        {MOODS.map(({ value, emoji, label }) => (
          <TouchableOpacity
            key={value}
            className={`items-center gap-1 p-3 rounded-lg ${mood === value ? 'bg-primary/10 border border-primary' : ''}`}
            onPress={() => setMood(value)}
          >
            <Text className="text-2xl">{emoji}</Text>
            <Text className="text-xs text-muted-foreground">{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Input label="Notes (optional)" value={notes} onChangeText={setNotes} multiline placeholder="How are you feeling?" />
      <Button onPress={handleSubmit} loading={logMood.isPending}>Save</Button>
    </LoggerModal>
  );
};
