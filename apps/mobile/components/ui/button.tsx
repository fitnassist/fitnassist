import {
  TouchableOpacity,
  ActivityIndicator,
  type TouchableOpacityProps,
} from 'react-native';
import { Text } from './text';

const variants = {
  default: 'bg-primary active:opacity-80',
  destructive: 'bg-destructive active:opacity-80',
  outline: 'border border-border bg-background active:bg-accent',
  secondary: 'bg-secondary active:opacity-80',
  ghost: 'active:bg-accent',
  link: '',
} as const;

const textVariants = {
  default: 'text-primary-foreground font-semibold',
  destructive: 'text-destructive-foreground font-semibold',
  outline: 'text-foreground font-semibold',
  secondary: 'text-secondary-foreground font-semibold',
  ghost: 'text-foreground font-semibold',
  link: 'text-primary underline font-semibold',
} as const;

const sizes = {
  default: 'h-12 px-6 rounded-lg',
  sm: 'h-10 px-4 rounded-md',
  lg: 'h-14 px-8 rounded-lg',
  icon: 'h-12 w-12 rounded-lg',
} as const;

export type ButtonProps = TouchableOpacityProps & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  children: React.ReactNode;
};

export const Button = ({
  variant = 'default',
  size = 'default',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      className={`flex-row items-center justify-center ${variants[variant]} ${sizes[size]} ${isDisabled ? 'opacity-50' : ''} ${className ?? ''}`}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'default' || variant === 'destructive' ? '#fff' : undefined}
          size="small"
        />
      ) : typeof children === 'string' ? (
        <Text className={textVariants[variant]}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};
