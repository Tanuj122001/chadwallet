import React from 'react';
import { View, ActivityIndicator } from 'react-native';

export interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = '#00E676', // Mapped to primary neon green for gains/brand contrast
  className = '',
}) => {
  return (
    <View className={`items-center justify-center p-space-md ${className}`}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};
