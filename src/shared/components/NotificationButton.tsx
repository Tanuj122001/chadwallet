import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

export interface NotificationButtonProps {
  onPress?: () => void;
  badgeCount?: number;
  className?: string;
}

export const NotificationButton: React.FC<NotificationButtonProps> = ({
  onPress = () => { },
  badgeCount = 0,
  className = '',
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      className={`w-10 h-10 rounded-full bg-[#1B1D25] border border-[#2A2D39] items-center justify-center ${className}`}
      onPress={onPress}
      accessibilityLabel="Notifications"
      accessibilityRole="button"
    >
      <FontAwesome6
        name="bell"
        size={20}
        color="#FFFFFF"
        iconStyle="regular"
      />

      {badgeCount > 0 && (
        <View className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#22F27C]" />
      )}
    </TouchableOpacity>
  );
};

export default NotificationButton;