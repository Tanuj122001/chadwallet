import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

export interface LogoProps {
  variant?: 'dark' | 'light';
  size?: number;
  className?: string;
  style?: StyleProp<ImageStyle>;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'dark',
  size = 40,
  className = '',
  style,
}) => {
  // Select the correct founder asset based on background guidelines
  const source = 
    variant === 'light' 
      ? require('../assets/images/branding/light.png') 
      : require('../assets/images/branding/dark.png');

  return (
    <Image
      source={source}
      style={[{ width: size, height: size, resizeMode: 'contain' }, style]}
      className={className}
      accessibilityRole="image"
      accessibilityLabel="ChadWallet Logo"
    />
  );
};

export default Logo;
