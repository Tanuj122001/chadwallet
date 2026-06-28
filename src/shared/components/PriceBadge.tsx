import React from 'react';
import { AppText } from './AppText';

export interface PriceBadgeProps {
  price: number;
  className?: string;
  variant?: 'display' | 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'bodySm' | 'caption' | 'crypto';
  color?: 'primary' | 'secondary' | 'accent';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
}

const formatPrice = (price: number): string => {
  if (price >= 1000) {
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (price >= 1) {
    return price.toFixed(2);
  }
  return price.toFixed(6);
};

export const PriceBadge: React.FC<PriceBadgeProps> = ({
  price,
  className = '',
  variant = 'body',
  color = 'primary',
  weight = 'bold',
}) => {
  return (
    <AppText variant={variant} color={color} weight={weight} className={className}>
      ${formatPrice(price)}
    </AppText>
  );
};

export default PriceBadge;
