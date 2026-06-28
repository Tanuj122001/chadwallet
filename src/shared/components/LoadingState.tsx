import React from 'react';
import { View } from 'react-native';
import { LoadingSpinner } from './LoadingSpinner';
import { Card } from './Card';
import { SkeletonLoader } from './SkeletonLoader';

export interface LoadingStateProps {
  variant?: 'full' | 'list';
  count?: number;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'list',
  count = 4,
  className = '',
}) => {
  if (variant === 'full') {
    return (
      <View className={`flex-1 justify-center items-center bg-background ${className}`}>
        <LoadingSpinner size="large" />
      </View>
    );
  }

  // List skeletons skeleton loader
  return (
    <View className={`flex-1 gap-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <Card key={idx} className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <SkeletonLoader variant="circle" width={40} height={40} className="mr-space-md" />
            <View className="flex-1 gap-y-2">
              <SkeletonLoader variant="text" width="50%" />
              <SkeletonLoader variant="text" width="30%" />
            </View>
          </View>
          <View className="items-end gap-y-2 w-20">
            <SkeletonLoader variant="text" width={80} />
            <SkeletonLoader variant="text" width={60} />
          </View>
        </Card>
      ))}
    </View>
  );
};

export default LoadingState;
