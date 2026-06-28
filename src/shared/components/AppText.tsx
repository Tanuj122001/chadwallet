import React from 'react';
import { Text, TextProps } from 'react-native';

export type AppTextVariant = 'display' | 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'bodySm' | 'caption' | 'crypto';
export type AppTextColor = 'primary' | 'secondary' | 'muted' | 'gains' | 'losses' | 'accent' | 'warning' | 'info';
export type AppTextWeight = 'regular' | 'medium' | 'semibold' | 'bold';
export type AppTextAlign = 'left' | 'center' | 'right';

export interface AppTextProps extends TextProps {
  variant?: AppTextVariant;
  color?: AppTextColor;
  weight?: AppTextWeight;
  align?: AppTextAlign;
  children: React.ReactNode;
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  color = 'primary',
  weight = 'regular',
  align = 'left',
  className = '',
  children,
  ...props
}) => {
  // Variant styles mapped from typography sizing
  const variantClasses = {
    display: 'text-[40px] leading-[52px]',
    h1: 'text-xxxl leading-[44px]',
    h2: 'text-xxl leading-[36px]',
    h3: 'text-xl leading-[30px]',
    h4: 'text-lg leading-[28px]',
    body: 'text-md leading-[24px]',
    bodySm: 'text-sm leading-[20px]',
    caption: 'text-xs leading-[16px]',
    crypto: 'text-[28px] font-mono leading-[36px]', // Distinct digital trading monospace design
  };

  // Color styles mapped from theme colors
  const colorClasses = {
    primary: 'text-text',
    secondary: 'text-textSecondary',
    muted: 'text-textMuted',
    gains: 'text-gains',
    losses: 'text-losses',
    accent: 'text-accent',
    warning: 'text-warning',
    info: 'text-info',
  };

  // Font weights
  const weightClasses = {
    regular: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  // Horizontal alignments
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const combinedClass = [
    variantClasses[variant],
    colorClasses[color],
    weightClasses[weight],
    alignClasses[align],
    className
  ].join(' ').trim();

  return (
    <Text className={combinedClass} {...props}>
      {children}
    </Text>
  );
};
