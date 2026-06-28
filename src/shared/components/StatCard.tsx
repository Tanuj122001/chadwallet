import React from 'react';
import { View } from 'react-native';
import { AppText } from './AppText';

export interface StatCardProps {
  label: string;
  value: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = React.memo(({
  label,
  value,
  className = '',
}) => {
  return (
    <View className={`bg-[#16171F] border border-[#2A2D39] rounded-[18px] p-4 ${className}`}>
      <AppText className="text-[#8D94A7] text-[11px] font-semibold uppercase tracking-wider">
        {label}
      </AppText>
      <AppText className="text-white text-[15px] font-bold mt-1" numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
});

export default StatCard;
