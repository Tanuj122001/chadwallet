import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search tokens',
  onFilterPress = () => { },
  className = '',
}) => {
  return (
    <View
      className={`flex-row items-center bg-[#15161F] border border-[#2A2D39] rounded-[26px] h-[52px] px-4 ${className}`}
      style={{ shadowOpacity: 0, elevation: 0 }}
    >
      {/* Search Icon */}
      <FontAwesome6
        name="magnifying-glass"
        size={18}
        color="#6F7582"
        iconStyle="solid"
      />

      <TextInput
        className="flex-1 text-white text-[14px] font-medium h-full py-0 ml-3"
        placeholder={placeholder}
        placeholderTextColor="#6F7582"
        value={value}
        onChangeText={onChangeText}
        autoCorrect={false}
        autoCapitalize="none"
        style={{ textAlignVertical: 'center' }}
      />

      {/* Filter Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        className="w-8 h-8 rounded-full bg-[#1B1D25] border border-[#2A2D39] items-center justify-center ml-2"
        onPress={onFilterPress}
        accessibilityLabel="Filter"
        accessibilityRole="button"
      >
        <FontAwesome6
          name="sliders"
          size={14}
          color="#FFFFFF"
          iconStyle="solid"
        />
      </TouchableOpacity>
    </View>
  );
};

export default SearchBar;