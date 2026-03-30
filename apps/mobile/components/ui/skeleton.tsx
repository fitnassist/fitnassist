import { useEffect, useRef } from 'react';
import { View, Animated, type ViewProps } from 'react-native';

export type SkeletonProps = ViewProps;

export const Skeleton = ({ className, style, ...props }: SkeletonProps) => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      className={`rounded-md bg-muted ${className ?? ''}`}
      style={[{ opacity }, style]}
      {...props}
    />
  );
};
