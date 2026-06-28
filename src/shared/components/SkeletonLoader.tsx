import React, { useEffect, useRef } from 'react';
import { Animated, ViewProps, DimensionValue } from 'react-native';

export interface SkeletonLoaderProps extends ViewProps {
  width?: DimensionValue;
  height?: DimensionValue;
  variant?: 'rect' | 'circle' | 'text';
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  variant = 'rect',
  className = '',
  style,
  ...props
}) => {
  // Shimmer pulse animation driving opacity
  const opacity = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.2,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    
    animation.start();
    
    return () => animation.stop();
  }, [opacity]);

  // Radius based on loader shape
  const borderClass = 
    variant === 'circle' 
      ? 'rounded-radius-full' 
      : variant === 'text' 
      ? 'rounded-radius-xs' 
      : 'rounded-radius-md';

  return (
    <Animated.View
      className={`bg-border ${borderClass} ${className}`}
      style={[
        {
          width,
          height: variant === 'text' ? 14 : height,
          opacity,
        },
        style,
      ]}
      {...props}
    />
  );
};
