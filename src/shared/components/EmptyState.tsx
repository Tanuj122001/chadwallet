import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { AppText } from './AppText';
import { PrimaryButton } from './PrimaryButton';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionTitle?: string;
  onActionPress?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionTitle,
  onActionPress,
  className = '',
}) => {
  return (
    <View className={`items-center justify-center p-space-xl bg-surface border border-border border-dashed rounded-radius-xl ${className}`}>
      <View className="mb-space-lg items-center justify-center">
        {icon || (
          // Sleek dashed empty token/wallet ring
          <Svg width={64} height={64} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={10} stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="3 3" />
            <Path
              d="M9 12h6M12 9v6"
              stroke="#94A3B8"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        )}
      </View>
      
      <AppText variant="h4" weight="bold" color="primary" align="center" className="mb-space-xs">
        {title}
      </AppText>
      
      <AppText variant="bodySm" color="secondary" align="center" className="mb-space-lg max-w-[260px]">
        {description}
      </AppText>
      
      {actionTitle && onActionPress && (
        <PrimaryButton
          title={actionTitle}
          onPress={onActionPress}
          className="max-w-[200px] h-10"
        />
      )}
    </View>
  );
};
