import { LinearGradient } from 'expo-linear-gradient';
import type { ViewStyle } from 'react-native';

interface GradientBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const GradientBackground = ({ children, style }: GradientBackgroundProps) => {
  return (
    <LinearGradient
      colors={['#20415c', '#5a0c30']}
      style={[{ flex: 1 }, style]}
    >
      {children}
    </LinearGradient>
  );
};
