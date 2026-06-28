import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabItem } from './BottomTabItem';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

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
        height: 82 + insets.bottom,
        paddingBottom: insets.bottom,
        borderTopWidth: 1,
        borderTopColor: '#2A2D39',
        backgroundColor: '#111217',
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
            size={22}
            color="#FFFFFF"
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
            size={22}
            color="#FFFFFF"
            iconStyle="solid"
          />
        }
        active={activeTab === 'Search'}
        onPress={() => onTabPress('Search')}
      />

      {/* Center larger floating circular green button */}
      <TouchableOpacity
        activeOpacity={0.95}
        style={styles.centerButton}
        className="bg-[#22F27C] items-center justify-center rounded-full"
        onPress={() => onTabPress('Plus')}
        accessibilityLabel="Action Menu"
        accessibilityRole="button"
      >
        <FontAwesome6
          name="plus"
          size={28}
          color="#000000"
          iconStyle="solid"
        />
      </TouchableOpacity>

      <BottomTabItem
        label="Portfolio"
        icon={
          <FontAwesome6
            name="briefcase"
            size={22}
            color="#FFFFFF"
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
            size={22}
            color="#FFFFFF"
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
    width: 60,
    height: 60,
    marginTop: -28,
    shadowColor: '#22F27C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
});

export default BottomTabBar;
