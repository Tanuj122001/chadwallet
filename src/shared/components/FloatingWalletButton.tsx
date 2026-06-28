import React from 'react';
import { FloatingActionButton } from './FloatingActionButton';

export interface FloatingWalletButtonProps {
  onPress: () => void;
  className?: string;
  glow?: string;
  badgeCount?: number;
}

export const FloatingWalletButton: React.FC<FloatingWalletButtonProps> = ({
  onPress,
  className = '',
}) => {
  return <FloatingActionButton onPress={onPress} className={className} />;
};

export default FloatingWalletButton;
