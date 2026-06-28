import React from 'react';
import { View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppHeader } from '../components/AppHeader';
import { AppText } from '../components/AppText';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../../core/navigation/AuthContext';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();

  return (
    <ScreenContainer scrollable={false} padding={true}>
      <AppHeader title="Login" />
      <View className="flex-1 justify-center items-center px-space-lg">
        <AppText variant="h2" align="center" className="mb-space-xl">
          Login Screen Placeholder
        </AppText>
        <PrimaryButton title="Simulate Sign In" onPress={login} />
      </View>
    </ScreenContainer>
  );
};
export default LoginScreen;
