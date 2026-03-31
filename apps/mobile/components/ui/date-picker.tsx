import { useState } from 'react';
import { View, Platform, Modal } from 'react-native';
import { TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar as CalendarIcon } from 'lucide-react-native';
import { Text } from './text';
import { Button } from './button';
import { colors } from '@/constants/theme';

interface DatePickerProps {
  value: string; // YYYY-MM-DD or empty
  onChange: (date: string) => void;
  placeholder?: string;
  label?: string;
  minDate?: Date;
  maxDate?: Date;
}

export const DatePicker = ({ value, onChange, placeholder = 'Select date', label, minDate, maxDate }: DatePickerProps) => {
  const [show, setShow] = useState(false);

  const parseDate = (v: string): Date => {
    if (!v) return new Date();
    // Handle YYYY-MM-DD, full ISO strings, or Date objects stringified
    const dateStr = v.includes('T') ? v.split('T')[0]! : v;
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y!, (m ?? 1) - 1, d ?? 1, 12, 0, 0);
  };

  const [tempDate, setTempDate] = useState<Date>(parseDate(value));

  const displayText = value
    ? parseDate(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : placeholder;

  const handleChange = (_event: any, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
      if (selected) {
        onChange(selected.toISOString().split('T')[0]!);
      }
    } else {
      if (selected) setTempDate(selected);
    }
  };

  const handleConfirmIOS = () => {
    onChange(tempDate.toISOString().split('T')[0]!);
    setShow(false);
  };

  return (
    <View className="gap-1.5">
      {label && <Text className="text-sm font-medium text-foreground">{label}</Text>}
      <TouchableOpacity
        className="h-12 rounded-lg border border-border bg-background justify-center px-4 flex-row items-center"
        onPress={() => {
          if (value) setTempDate(new Date(value + 'T12:00:00'));
          setShow(true);
        }}
      >
        <Text className={`flex-1 text-base ${value ? 'text-foreground' : 'text-muted-foreground'}`}>
          {displayText}
        </Text>
        <CalendarIcon size={18} color={colors.mutedForeground} />
      </TouchableOpacity>

      {Platform.OS === 'ios' ? (
        <Modal visible={show} transparent animationType="fade" onRequestClose={() => setShow(false)}>
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-card rounded-t-2xl px-4 pb-8 pt-4">
              <View className="flex-row justify-between items-center mb-2">
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text className="text-sm text-muted-foreground">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleConfirmIOS}>
                  <Text className="text-sm font-semibold text-teal">Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleChange}
                minimumDate={minDate}
                maximumDate={maxDate}
                themeVariant="dark"
              />
            </View>
          </View>
        </Modal>
      ) : (
        show && (
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="default"
            onChange={handleChange}
            minimumDate={minDate}
            maximumDate={maxDate}
          />
        )
      )}
    </View>
  );
};
