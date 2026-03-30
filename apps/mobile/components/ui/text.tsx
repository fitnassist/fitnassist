import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

export type TextProps = RNTextProps;

export const Text = ({ className, ...props }: TextProps) => {
  return <RNText className={`text-foreground ${className ?? ''}`} {...props} />;
};
