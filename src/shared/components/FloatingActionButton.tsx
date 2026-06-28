import React from 'react';
import { TouchableOpacity, Image, StyleSheet, View } from 'react-native';

export interface FloatingActionButtonProps {
  onPress: () => void;
  className?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = React.memo(({
  onPress,
  className = '',
}) => {
  return (
    <View className={`absolute bottom-28 right-6 z-50 ${className}`}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.95}
        style={styles.shadow}
        className="w-[72px] h-[72px] bg-[#22F27C] rounded-full items-center justify-center"
        accessibilityLabel="Wallet actions"
        accessibilityRole="button"
      >
        {/* Scaled founder logo asset (dark.png) inside circular green container */}
        <Image 
          source={require('../assets/images/branding/dark.png')} 
          style={{ width: 44, height: 44, resizeMode: 'contain' }}
        />
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  }
});

export default FloatingActionButton;
