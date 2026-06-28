import React from 'react';
import { TouchableOpacity } from 'react-native';

export interface SocialButtonProps {
  icon: React.ReactElement<{ size?: number; color?: string }>;
  onPress: () => void;
  className?: string;
}

export const SocialButton: React.FC<SocialButtonProps> = React.memo(({
  icon,
  onPress,
  className = '',
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      className={`w-11 h-11 bg-[#16171F] border border-[#2A2D39] rounded-[10px] items-center justify-center ${className}`}
      onPress={onPress}
      accessibilityRole="button"
    >
      {React.cloneElement(icon, { size: 20, color: '#FFFFFF' })}
    </TouchableOpacity>
  );
});

export default SocialButton;
