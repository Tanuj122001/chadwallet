import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppText } from './AppText';

export interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  leftAction?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBack = false,
  onBackPress,
  rightAction,
  leftAction,
}) => {
  return (
    <View className="flex-row items-center justify-between h-16 px-space-md border-b border-border bg-background">
      {/* Left container */}
      <View className="flex-row items-center justify-start min-w-[48px] h-full">
        {showBack ? (
          <TouchableOpacity
            onPress={onBackPress}
            activeOpacity={0.7}
            className="p-space-xs rounded-radius-full bg-surface items-center justify-center w-9 h-9"
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 19L8 12L15 5"
                stroke="#FFFFFF"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        ) : (
          leftAction || null
        )}
      </View>

      {/* Middle Title */}
      <View className="flex-1 items-center justify-center">
        <AppText variant="h4" weight="bold" color="primary" numberOfLines={1} align="center">
          {title}
        </AppText>
      </View>

      {/* Right container */}
      <View className="flex-row items-center justify-end min-w-[48px] h-full">
        {rightAction || null}
      </View>
    </View>
  );
};
