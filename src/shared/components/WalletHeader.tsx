import React from 'react';
import { View } from 'react-native';
import { AppText } from './AppText';
import { Logo } from './Logo';
import { NotificationButton } from './NotificationButton';
import { AvatarButton } from './AvatarButton';

export interface WalletHeaderProps {
  userName?: string;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  className?: string;
}

export const WalletHeader: React.FC<WalletHeaderProps> = ({
  userName = "ChadWallet",
  onNotificationPress = () => {},
  onProfilePress = () => {},
  className = '',
}) => {
  return (
    <View 
      className={`flex-row items-center justify-between h-[72px] px-5 bg-transparent ${className}`}
      style={{ minHeight: 72 }}
    >
      {/* Left: Founder logo */}
      <Logo variant="dark" size={36} />

      {/* Center: Greeting */}
      <View className="flex-1 ml-4 justify-center">
        <AppText className="text-[#8D94A7] text-[14px] font-medium leading-5">
          Good Morning,
        </AppText>
        <AppText 
          className="text-white text-[30px] font-bold leading-9 tracking-tight" 
          style={{ letterSpacing: -0.4 }}
          numberOfLines={1}
        >
          {userName}
        </AppText>
      </View>

      {/* Right: Actions */}
      <View className="flex-row items-center gap-x-3">
        {/* Notification Button */}
        <NotificationButton onPress={onNotificationPress} />

        {/* Profile Button */}
        <AvatarButton onPress={onProfilePress} />
      </View>
    </View>
  );
};

export default WalletHeader;
