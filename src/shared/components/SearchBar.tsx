import React, { forwardRef } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { colors } from '../theme/colors';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  className?: string;
}

export const SearchBar = forwardRef<TextInput, SearchBarProps>(({
  value,
  onChangeText,
  placeholder = 'Search tokens',
  onFilterPress = () => { },
  className = '',
}, ref) => {
  return (
    <View
      className={`flex-row items-center bg-surface border border-borderAlpha rounded-radius-full h-12 px-4 shadow-sm ${className}`}
      style={{ shadowOpacity: 0, elevation: 0 }}
    >
      {/* Search Icon */}
      <FontAwesome6
        name="magnifying-glass"
        size={16}
        color={colors.textMuted}
        iconStyle="solid"
      />

      <TextInput
        ref={ref}
        className="flex-1 text-white text-[14px] font-medium h-full py-0 ml-3"
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        autoCorrect={false}
        autoCapitalize="none"
        style={{ textAlignVertical: 'center' }}
      />

      {/* Filter Button */}
      <TouchableOpacity
        activeOpacity={0.88}
        className="w-8 h-8 rounded-full bg-surfaceHover border border-borderAlpha items-center justify-center ml-2"
        onPress={onFilterPress}
        accessibilityLabel="Filter"
        accessibilityRole="button"
      >
        <FontAwesome6
          name="sliders"
          size={14}
          color={colors.text}
          iconStyle="solid"
        />
      </TouchableOpacity>
    </View>
  );
});

export default SearchBar;