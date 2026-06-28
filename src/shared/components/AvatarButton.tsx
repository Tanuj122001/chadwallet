import React from 'react';
import { TouchableOpacity } from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
export interface AvatarButtonProps {
  onPress?: () => void;
  className?: string;
}

export const AvatarButton: React.FC<AvatarButtonProps> = ({
  onPress = () => { },
  className = '',
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      className={`w-10 h-10 rounded-full bg-[#1B1D25] border border-[#2A2D39] items-center justify-center ${className}`}
      onPress={onPress}
      accessibilityLabel="Profile"
      accessibilityRole="button"
    >
      <FontAwesome6
        name="user"
        size={20}
        color="#FFFFFF"
        iconStyle="solid"
      />
    </TouchableOpacity>
  );
};

export default AvatarButton;
