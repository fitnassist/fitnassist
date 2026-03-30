import { View, type ViewProps } from 'react-native';

export type SkeletonProps = ViewProps;

export const Skeleton = ({ className, ...props }: SkeletonProps) => {
  return (
    <View
      className={`rounded-md bg-muted animate-pulse ${className ?? ''}`}
      {...props}
    />
  );
};
