import React from 'react';
import { TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { AppText } from './AppText';

export interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon,
  className = '',
}) => {
  const isInteractionDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isInteractionDisabled}
      activeOpacity={0.8}
      className={`w-full flex-row items-center justify-center h-12 bg-transparent border border-border rounded-radius-md px-space-lg ${
        isInteractionDisabled ? 'opacity-40' : 'active:bg-surface'
      } ${className}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: isInteractionDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <View className="flex-row items-center justify-center">
          {icon && <View className="mr-space-sm">{icon}</View>}
          <AppText variant="body" weight="semibold" color="primary">
            {title}
          </AppText>
        </View>
      )}
    </TouchableOpacity>
  );
};
