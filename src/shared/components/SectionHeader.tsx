import React from 'react';
import { View } from 'react-native';
import { AppText } from './AppText';

export interface SectionHeaderProps {
  title: string;
  rightElement?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  rightElement,
  className = '',
}) => {
  return (
    <View className={`flex-row justify-between items-center ${className}`}>
      <AppText variant="body" weight="bold">
        {title}
      </AppText>
      {rightElement || null}
    </View>
  );
};

export default SectionHeader;
