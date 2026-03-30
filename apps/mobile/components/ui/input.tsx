import { TextInput, View, type TextInputProps } from 'react-native';
import { Text } from './text';

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export const Input = ({ label, error, className, ...props }: InputProps) => {
  return (
    <View className="gap-1.5">
      {label && (
        <Text className="text-sm font-medium text-foreground">{label}</Text>
      )}
      <TextInput
        className={`h-12 rounded-lg border border-border bg-background px-4 text-base text-foreground ${
          error ? 'border-destructive' : ''
        } ${className ?? ''}`}
        placeholderTextColor="hsl(230, 15%, 45%)"
        autoCapitalize="none"
        {...props}
      />
      {error && (
        <Text className="text-sm text-destructive">{error}</Text>
      )}
    </View>
  );
};
