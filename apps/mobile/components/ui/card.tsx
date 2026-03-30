import { View, type ViewProps } from 'react-native';
import { Text } from './text';

export type CardProps = ViewProps;

export const Card = ({ className, ...props }: CardProps) => {
  return (
    <View
      className={`rounded-lg border border-border bg-card p-4 ${className ?? ''}`}
      {...props}
    />
  );
};

export type CardHeaderProps = ViewProps;

export const CardHeader = ({ className, ...props }: CardHeaderProps) => {
  return <View className={`gap-1.5 pb-3 ${className ?? ''}`} {...props} />;
};

export type CardTitleProps = React.ComponentProps<typeof Text>;

export const CardTitle = ({ className, ...props }: CardTitleProps) => {
  return (
    <Text className={`text-lg font-semibold text-card-foreground ${className ?? ''}`} {...props} />
  );
};

export type CardContentProps = ViewProps;

export const CardContent = ({ className, ...props }: CardContentProps) => {
  return <View className={className} {...props} />;
};
