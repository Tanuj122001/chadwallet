import React from 'react';
import { View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppHeader } from '../components/AppHeader';
import { AppText } from '../components/AppText';
import { Logo } from '../components/Logo';

export const PortfolioScreen: React.FC = () => {
  return (
    <ScreenContainer scrollable={false} padding={true}>
      <AppHeader title="Portfolio" leftAction={<Logo variant="dark" size={32} />} />
      <View className="flex-1 justify-center items-center">
        <AppText variant="h2" align="center">
          Portfolio Screen Placeholder
        </AppText>
      </View>
    </ScreenContainer>
  );
};
export default PortfolioScreen;
