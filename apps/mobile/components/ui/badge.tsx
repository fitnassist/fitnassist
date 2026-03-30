import { View } from 'react-native';
import { Text } from './text';

const variants = {
  default: 'bg-primary',
  secondary: 'bg-secondary',
  destructive: 'bg-destructive',
  outline: 'border border-border bg-transparent',
} as const;

export type BadgeProps = {
  variant?: keyof typeof variants;
  children: React.ReactNode;
  className?: string;
};

export const Badge = ({ variant = 'default', children, className }: BadgeProps) => {
  return (
    <View className={`rounded-full px-2.5 py-0.5 ${variants[variant]} ${className ?? ''}`}>
      {typeof children === 'string' ? (
        <Text className="text-xs font-medium text-primary-foreground">{children}</Text>
      ) : (
        children
      )}
    </View>
  );
};
