import React from 'react';
import { View, ScrollView, StatusBar, SafeAreaView } from 'react-native';

export interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padding?: boolean;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = false,
  padding = true,
}) => {
  // Pure black background (#000000) and horizontal padding of 20dp (px-5)
  const containerClass = `flex-1 bg-black ${padding ? 'px-5 py-space-md' : ''}`;

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      {scrollable ? (
        <ScrollView
          className="flex-1 bg-black"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className={containerClass}>{children}</View>
        </ScrollView>
      ) : (
        <View className={containerClass}>{children}</View>
      )}
    </SafeAreaView>
  );
};

export default ScreenContainer;
