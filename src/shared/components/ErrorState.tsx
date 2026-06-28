import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppText } from './AppText';
import { SecondaryButton } from './SecondaryButton';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <View className={`items-center justify-center p-space-xl bg-surface border border-losses/20 rounded-radius-xl ${className}`}>
      <View className="mb-space-md items-center justify-center">

        <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            stroke="#FF3B30"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>

      <AppText variant="h4" weight="bold" color="losses" align="center" className="mb-space-xs">
        {title}
      </AppText>

      <AppText variant="bodySm" color="secondary" align="center" className="mb-space-lg max-w-[260px]">
        {message}
      </AppText>

      {onRetry && (
        <SecondaryButton
          title="Retry Connection"
          onPress={onRetry}
          className="max-w-[200px] h-10 border-losses/30"
        />
      )}
    </View>
  );
};
