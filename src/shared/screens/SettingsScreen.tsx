import React from 'react';
import { View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppHeader } from '../components/AppHeader';
import { AppText } from '../components/AppText';
import { SecondaryButton } from '../components/SecondaryButton';
import { useAuth } from '../../core/navigation/AuthContext';
import { Logo } from '../components/Logo';

export const SettingsScreen: React.FC = () => {
  const { logout } = useAuth();

  return (
    <ScreenContainer scrollable={false} padding={true}>
      <AppHeader title="Settings" leftAction={<Logo variant="dark" size={32} />} />
      <View className="flex-1 justify-center items-center px-space-lg">
        <AppText variant="h2" align="center" className="mb-space-xl">
          Settings Screen Placeholder
        </AppText>
        <SecondaryButton title="Simulate Sign Out" onPress={logout} />
      </View>
    </ScreenContainer>
  );
};
export default SettingsScreen;
