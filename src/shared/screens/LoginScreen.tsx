import React, { useState } from 'react';
import { View, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppText } from '../components/AppText';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../../core/navigation/AuthContext';
import { colors } from '../theme/colors';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [pin, setPin] = useState('');
  const [secureText, setSecureText] = useState(true);

  return (
    <ScreenContainer scrollable={false} padding={true}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-space-xl">
          {/* Brand/Logo Section */}
          <View className="items-center mb-space-3xl">
            <View className="w-16 h-16 bg-primary items-center justify-center rounded-2xl mb-space-lg shadow-lg">
              <FontAwesome6 name="wallet" size={28} color="#080A0C" iconStyle="solid" />
            </View>
            <AppText variant="h1" weight="bold" align="center" className="tracking-widest">
              CHADWALLET
            </AppText>
            <AppText variant="caption" color="secondary" align="center" className="mt-space-xs">
              Institutional Solana Wallet Node
            </AppText>
          </View>

          {/* Input Section */}
          <View className="mb-space-2xl">
            <AppText variant="caption" weight="semibold" color="secondary" className="mb-space-xs ml-1 uppercase tracking-wider">
              Enter Secure Wallet PIN
            </AppText>
            <View className="flex-row items-center bg-surface border border-borderAlpha rounded-radius-xl h-14 px-4 shadow-sm">
              <TextInput
                className="flex-1 text-white text-[16px] font-medium h-full py-0"
                placeholder="••••"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                secureTextEntry={secureText}
                maxLength={4}
                value={pin}
                onChangeText={setPin}
                style={{ textAlignVertical: 'center' }}
                accessibilityLabel="Wallet PIN Input"
              />
              <TouchableOpacity
                onPress={() => setSecureText(!secureText)}
                activeOpacity={0.88}
                className="p-2"
                accessibilityLabel="Toggle password visibility"
              >
                <FontAwesome6
                  name={secureText ? 'eye-slash' : 'eye'}
                  size={16}
                  color={colors.textSecondary}
                  iconStyle="solid"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Button */}
          <PrimaryButton
            title="Unlock Wallet"
            onPress={login}
            disabled={pin.length < 4}
            className="mb-space-lg shadow-lg"
          />

          <TouchableOpacity
            activeOpacity={0.88}
            className="items-center py-2"
            accessibilityRole="button"
          >
            <AppText variant="caption" color="primary" weight="semibold">
              Restore from Seed Phrase
            </AppText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

export default LoginScreen;
