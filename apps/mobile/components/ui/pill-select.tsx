import { View, TouchableOpacity } from 'react-native';
import { Text } from './text';

interface PillOption {
  value: string;
  label: string;
}

interface PillSelectProps {
  options: (string | PillOption)[];
  value: string | string[];
  onChange: (value: any) => void;
  multiple?: boolean;
  max?: number;
  formatLabel?: (value: string) => string;
}

const getLabel = (opt: string | PillOption): string =>
  typeof opt === 'string' ? opt.replace(/[-_]/g, ' ') : opt.label;

const getValue = (opt: string | PillOption): string =>
  typeof opt === 'string' ? opt : opt.value;

export const PillSelect = ({ options, value, onChange, multiple = false, max, formatLabel }: PillSelectProps) => {
  const selected = Array.isArray(value) ? value : [value];

  const handlePress = (optValue: string) => {
    if (multiple) {
      const current = selected.includes(optValue)
        ? selected.filter((v) => v !== optValue)
        : max && selected.length >= max
          ? selected
          : [...selected, optValue];
      onChange(current);
    } else {
      onChange(optValue);
    }
  };

  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((opt) => {
        const optValue = getValue(opt);
        const active = selected.includes(optValue);
        const label = formatLabel ? formatLabel(optValue) : getLabel(opt);
        return (
          <TouchableOpacity
            key={optValue}
            className={`px-3 py-2 rounded-lg border ${active ? 'border-teal bg-teal/10' : 'border-border'}`}
            onPress={() => handlePress(optValue)}
          >
            <Text className={`text-xs font-medium ${active ? 'text-teal' : 'text-muted-foreground'}`}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
