import React from 'react';
import { View, TouchableOpacity, ViewStyle } from 'react-native';
import { shadows } from '../theme/shadows';

export interface CardProps {
  children: React.ReactNode;
  glow?: 'none' | 'gains' | 'losses' | 'purple';
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
  // Premium glassmorphic baseline styling: border highlighted by borderAlpha, background via slate bg-surface
  const baseClass = "bg-surface border border-borderAlpha rounded-radius-2xl p-space-lg shadow-sm";
  const combinedClass = `${baseClass} ${className}`;

  const glowStyle = 
    glow === 'gains' 
      ? shadows.glowGreen 
      : glow === 'losses' 
      ? shadows.glowRed 
      : glow === 'purple'
      ? shadows.glowPurple
      : shadows.none;

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.88}
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
