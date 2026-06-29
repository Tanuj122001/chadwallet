import React, { useEffect, useRef } from 'react';
import { Animated, ViewProps, DimensionValue } from 'react-native';
import { colors } from '../theme/colors';

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
  const opacity = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.15,
          duration: 900,
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
      : 'rounded-radius-2xl';

  return (
    <Animated.View
      className={`${borderClass} ${className}`}
      style={[
        {
          width,
          height: variant === 'text' ? 14 : height,
          opacity,
          backgroundColor: colors.textSecondary,
        },
        style,
      ]}
      {...props}
    />
  );
};
