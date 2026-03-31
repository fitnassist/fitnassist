import { TextInput, View, type TextInputProps } from 'react-native';
import { Text } from './text';

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  variant?: 'default' | 'dark';
};

export const Input = ({ label, error, variant = 'default', className, multiline, style, ...props }: InputProps) => {
  const isDark = variant === 'dark';

  return (
    <View className="gap-1.5">
      {label && (
        <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-foreground'}`}>
          {label}
        </Text>
      )}
      <View
        className={`rounded-lg border ${multiline ? 'py-3' : 'h-12 justify-center'} ${
          isDark
            ? 'border-white/20 bg-white/10'
            : 'border-border bg-background'
        } ${error ? 'border-destructive' : ''}`}
      >
        <TextInput
          className={`px-4 ${isDark ? 'text-white' : 'text-foreground'} ${className ?? ''}`}
          style={[{ fontSize: 16, margin: 0, padding: 0 }, multiline && { textAlignVertical: 'top' as const }, style]}
          placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'hsl(230, 10%, 55%)'}
          autoCapitalize="none"
          multiline={multiline}
          {...props}
        />
      </View>
      {error && (
        <Text className="text-sm text-destructive">{error}</Text>
      )}
    </View>
  );
};
