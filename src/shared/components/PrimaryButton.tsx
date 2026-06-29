import React from 'react';
import { TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { AppText } from './AppText';

export interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
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
      activeOpacity={0.88}
      className={`w-full flex-row items-center justify-center h-12 bg-primary rounded-radius-xl px-space-lg shadow-md ${
        isInteractionDisabled ? 'opacity-50' : 'active:bg-primaryHover'
      } ${className}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: isInteractionDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color="#080A0C" size="small" />
      ) : (
        <View className="flex-row items-center justify-center">
          {icon && <View className="mr-space-sm">{icon}</View>}
          <AppText variant="body" weight="bold" className="text-slate-900">
            {title}
          </AppText>
        </View>
      )}
    </TouchableOpacity>
  );
};
