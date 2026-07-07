import React from 'react';
import { View, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';

export interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padding?: boolean;
  edges?: Edge[];
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = false,
  padding = true,
  edges = ['top', 'left', 'right', 'bottom'],
}) => {
  // Pure black background (#000000) and horizontal padding of 20dp (px-5)
  const containerClass = `flex-1 bg-black ${padding ? 'px-5 py-space-md' : ''}`;

  return (
    <SafeAreaView edges={edges} className="flex-1 bg-black">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
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
