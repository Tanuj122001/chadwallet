import React from 'react';
import { TouchableOpacity } from 'react-native';
import { AppText } from './AppText';

export interface BottomTabItemProps {
  label: string;
  icon: React.ReactElement<{ color?: string }>;
  active: boolean;
  onPress: () => void;
}

export const BottomTabItem: React.FC<BottomTabItemProps> = React.memo(({
  label,
  icon,
  active,
  onPress,
}) => {
  const activeColor = '#22F27C';
  const inactiveColor = '#7B8393';
  const color = active ? activeColor : inactiveColor;

  // Clone vector icon node to pass dynamic active/inactive color codes
  const iconWithColor = React.cloneElement(icon, { color });

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={onPress}
      className="items-center justify-center flex-1 h-full py-1"
    >
      {iconWithColor}
      <AppText
        className="text-[11px] mt-1"
        weight={active ? 'bold' : 'medium'}
        style={{ color }}
      >
        {label}
      </AppText>
    </TouchableOpacity>
  );
});

export default BottomTabItem;
