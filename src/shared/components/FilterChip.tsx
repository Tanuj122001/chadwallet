import React from 'react';
import { TouchableOpacity } from 'react-native';
import { AppText } from './AppText';

export interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  className?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  selected,
  onPress,
  className = '',
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`items-center justify-center px-4 h-[36px] rounded-full border ${
        selected
          ? 'bg-[#22F27C] border-[#22F27C]'
          : 'bg-[#1B1D25] border-[#2A2D39]'
      } ${className}`}
    >
      <AppText
        variant="body"
        weight={selected ? 'bold' : 'medium'}
        className={selected ? 'text-black' : 'text-white'}
      >
        {label}
      </AppText>
    </TouchableOpacity>
  );
};

export default FilterChip;
