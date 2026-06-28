import React from 'react';
import { View } from 'react-native';
import { AppText } from './AppText';

export interface PercentageBadgeProps {
  change: number;
  className?: string;
  size?: 'sm' | 'md';
}

export const PercentageBadge: React.FC<PercentageBadgeProps> = ({
  change,
  className = '',
  size = 'md',
}) => {
  const isPositive = change >= 0;
  const badgeColor = isPositive ? 'gains' : 'losses';
  const sign = isPositive ? '+' : '';
  const containerPadding = size === 'sm' ? 'px-1.5 py-0.5' : 'px-space-sm py-1';
  const textVariant = size === 'sm' ? 'caption' : 'bodySm';

  return (
    <View className={`rounded-radius-md ${containerPadding} ${
      isPositive ? 'bg-primary/10 border border-primary/20' : 'bg-losses/10 border border-losses/20'
    } ${className}`}>
      <AppText variant={textVariant} color={badgeColor} weight="bold">
        {sign}{change}%
      </AppText>
    </View>
  );
};

export default PercentageBadge;
