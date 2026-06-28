import React from 'react';
import { TouchableOpacity } from 'react-native';

export interface IconButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  onPress,
  disabled = false,
  className = '',
  variant = 'secondary',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-radius-full p-1',
    md: 'w-10 h-10 rounded-radius-full p-2',
    lg: 'w-12 h-12 rounded-radius-full p-3',
  };

  const variantClasses = {
    primary: 'bg-primary active:bg-primaryHover',
    secondary: 'bg-surface border border-border active:bg-surfaceHover',
    ghost: 'bg-transparent active:bg-surface',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      className={`items-center justify-center ${sizeClasses[size]} ${variantClasses[variant]} ${
        disabled ? 'opacity-50' : ''
      } ${className}`}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      {children}
    </TouchableOpacity>
  );
};
