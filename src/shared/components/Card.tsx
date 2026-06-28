import React from 'react';
import { View, TouchableOpacity, ViewStyle } from 'react-native';
import { shadows } from '../theme/shadows';

export interface CardProps {
  children: React.ReactNode;
  glow?: 'none' | 'gains' | 'losses';
  onPress?: () => void;
  className?: string;
  style?: ViewStyle | ViewStyle[];
}

export const Card: React.FC<CardProps> = ({
  children,
  glow = 'none',
  onPress,
  className = '',
  style,
}) => {
  const baseClass = "bg-surface border border-border rounded-radius-lg p-space-lg";
  const combinedClass = `${baseClass} ${className}`;

  const glowStyle = 
    glow === 'gains' 
      ? shadows.glowGreen 
      : glow === 'losses' 
      ? shadows.glowRed 
      : shadows.none;

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        className={combinedClass}
        style={[glowStyle, style as ViewStyle]}
        accessibilityRole="button"
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      className={combinedClass}
      style={[glowStyle, style as ViewStyle]}
    >
      {children}
    </View>
  );
};
