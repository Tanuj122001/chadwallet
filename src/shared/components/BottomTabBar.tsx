import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabItem } from './BottomTabItem';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { colors } from '../theme/colors';
import { shadows } from '../theme/shadows';

export interface BottomTabBarProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
  className?: string;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = React.memo(({
  activeTab,
  onTabPress,
  className = '',
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        height: 74 + insets.bottom,
        paddingBottom: insets.bottom,
        borderTopWidth: 1,
        borderTopColor: colors.borderAlpha,
        backgroundColor: colors.surface,
        shadowOpacity: 0,
        elevation: 0,
      }}
      className={`flex-row items-center justify-around px-2 ${className}`}
    >
      <BottomTabItem
        label="Home"
        icon={
          <FontAwesome6
            name="house"
            size={20}
            color={colors.text}
            iconStyle="solid"
          />
        }
        active={activeTab === 'Home'}
        onPress={() => onTabPress('Home')}
      />
      <BottomTabItem
        label="Search"
        icon={
          <FontAwesome6
            name="magnifying-glass"
            size={20}
            color={colors.text}
            iconStyle="solid"
          />
        }
        active={activeTab === 'Search'}
        onPress={() => onTabPress('Search')}
      />

      {/* Center larger floating circular green button */}
      <TouchableOpacity
        activeOpacity={0.88}
        style={styles.centerButton}
        className="bg-primary items-center justify-center rounded-full"
        onPress={() => onTabPress('Plus')}
        accessibilityLabel="Action Menu"
        accessibilityRole="button"
      >
        <FontAwesome6
          name="plus"
          size={24}
          color="#080A0C"
          iconStyle="solid"
        />
      </TouchableOpacity>

      <BottomTabItem
        label="Portfolio"
        icon={
          <FontAwesome6
            name="briefcase"
            size={20}
            color={colors.text}
            iconStyle="solid"
          />
        }
        active={activeTab === 'Portfolio'}
        onPress={() => onTabPress('Portfolio')}
      />
      <BottomTabItem
        label="Settings"
        icon={
          <FontAwesome6
            name="gear"
            size={20}
            color={colors.text}
            iconStyle="solid"
          />
        }
        active={activeTab === 'Settings'}
        onPress={() => onTabPress('Settings')}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  centerButton: {
    width: 56,
    height: 56,
    marginTop: -28,
    ...shadows.glowGreen,
  },
});

export default BottomTabBar;
