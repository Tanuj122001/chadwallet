import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { PrimaryButton } from './PrimaryButton';
import { colors } from '../theme/colors';
import { toast } from './ToastManager';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

export type SettingsDetailType = 'biometrics' | 'autolock' | 'currency' | 'language' | 'rpc' | 'backup';

export interface SettingsDetailSheetProps {
  visible: boolean;
  type: SettingsDetailType;
  onClose: () => void;
}

const SEED_WORDS = [
  'alpha', 'whisper', 'jupiter', 'raydium', 'solana', 'phantom',
  'backpack', 'quantum', 'galaxy', 'meteor', 'nebula', 'gravity'
];

export const SettingsDetailSheet: React.FC<SettingsDetailSheetProps> = ({ visible, type, onClose }) => {
  const insets = useSafeAreaInsets();
  const [rpcUrl, setRpcUrl] = useState('https://api.mainnet-beta.solana.com');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [autoLock, setAutoLock] = useState('15m');
  const [biometrics, setBiometrics] = useState(true);

  const saveConfig = () => {
    toast.success('Configuration saved successfully.');
    onClose();
  };

  const renderContent = () => {
    switch (type) {
      case 'biometrics':
        return (
          <View>
            <AppText variant="bodySm" color="secondary" className="mb-4">
              Toggle biometric authentication to unlock your wallet using Face ID, Touch ID, or Android Fingerprint.
            </AppText>
            <TouchableOpacity
              onPress={() => setBiometrics(!biometrics)}
              className="flex-row items-center justify-between p-4 bg-surfaceHover border border-borderAlpha rounded-radius-xl"
            >
              <AppText variant="body" weight="bold">Biometric Authentication</AppText>
              <FontAwesome6
                name={biometrics ? 'toggle-on' : 'toggle-off'}
                size={28}
                color={biometrics ? colors.primary : colors.textMuted}
                iconStyle="solid"
              />
            </TouchableOpacity>
            <View className="mt-6">
              <PrimaryButton title="Save Changes" onPress={saveConfig} />
            </View>
          </View>
        );

      case 'autolock':
        return (
          <View>
            <AppText variant="bodySm" color="secondary" className="mb-4">
              Choose the inactivity duration after which ChadWallet will lock automatically.
            </AppText>
            {['1m', '5m', '15m', '1h', 'Never'].map(opt => {
              const isSelected = autoLock === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => setAutoLock(opt)}
                  className={`flex-row items-center justify-between p-4 bg-surfaceHover border rounded-radius-xl mb-2 ${
                    isSelected ? 'border-primary' : 'border-borderAlpha'
                  }`}
                >
                  <AppText variant="body" weight="semibold">{opt}</AppText>
                  {isSelected && <FontAwesome6 name="check" size={16} color={colors.primary} iconStyle="solid" />}
                </TouchableOpacity>
              );
            })}
            <View className="mt-6">
              <PrimaryButton title="Save Changes" onPress={saveConfig} />
            </View>
          </View>
        );

      case 'currency':
        return (
          <View>
            <AppText variant="bodySm" color="secondary" className="mb-4">
              Set the base fiat currency for viewing market quotes and wallet balances.
            </AppText>
            {['USD', 'EUR', 'GBP', 'SOL'].map(opt => {
              const isSelected = selectedCurrency === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => setSelectedCurrency(opt)}
                  className={`flex-row items-center justify-between p-4 bg-surfaceHover border rounded-radius-xl mb-2 ${
                    isSelected ? 'border-primary' : 'border-borderAlpha'
                  }`}
                >
                  <AppText variant="body" weight="semibold">{opt}</AppText>
                  {isSelected && <FontAwesome6 name="check" size={16} color={colors.primary} iconStyle="solid" />}
                </TouchableOpacity>
              );
            })}
            <View className="mt-6">
              <PrimaryButton title="Save Changes" onPress={saveConfig} />
            </View>
          </View>
        );

      case 'language':
        return (
          <View>
            <AppText variant="bodySm" color="secondary" className="mb-4">
              Select your default application display language.
            </AppText>
            {['English', 'Spanish', 'French', 'Chinese'].map(opt => {
              const isSelected = selectedLanguage === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => setSelectedLanguage(opt)}
                  className={`flex-row items-center justify-between p-4 bg-surfaceHover border rounded-radius-xl mb-2 ${
                    isSelected ? 'border-primary' : 'border-borderAlpha'
                  }`}
                >
                  <AppText variant="body" weight="semibold">{opt}</AppText>
                  {isSelected && <FontAwesome6 name="check" size={16} color={colors.primary} iconStyle="solid" />}
                </TouchableOpacity>
              );
            })}
            <View className="mt-6">
              <PrimaryButton title="Save Changes" onPress={saveConfig} />
            </View>
          </View>
        );

      case 'rpc':
        return (
          <View>
            <AppText variant="bodySm" color="secondary" className="mb-4">
              Configure a custom Solana RPC node url to prioritize transaction broadcasts.
            </AppText>
            <TextInput
              value={rpcUrl}
              onChangeText={setRpcUrl}
              className="w-full text-white text-[15px] font-medium h-12 bg-surfaceHover border border-borderAlpha rounded-radius-xl px-4 py-0 mb-6"
              placeholder="Solana RPC Url"
              placeholderTextColor={colors.textMuted}
            />
            <PrimaryButton title="Save Connection" onPress={saveConfig} />
          </View>
        );

      case 'backup':
        return (
          <View>
            <AppText variant="bodySm" color="secondary" className="mb-4">
              Never share your recovery phrase. Anyone with these 12 words can access all your funds.
            </AppText>
            <View className="flex-row flex-wrap justify-between mb-6">
              {SEED_WORDS.map((w, index) => (
                <View
                  key={index}
                  className="w-[30%] bg-surfaceHover border border-borderAlpha rounded-xl p-3 mb-2 flex-row items-center"
                >
                  <AppText variant="caption" color="secondary" className="mr-1.5 font-bold">
                    {index + 1}.
                  </AppText>
                  <AppText variant="bodySm" weight="bold">
                    {w}
                  </AppText>
                </View>
              ))}
            </View>
            <PrimaryButton
              title="Copy to Clipboard"
              onPress={() => {
                toast.success('Mnemonic recovery words copied to clipboard!');
                onClose();
              }}
            />
          </View>
        );
    }
  };

  const titleConfig = {
    biometrics: 'Biometric Settings',
    autolock: 'Auto Lock Delay',
    currency: 'Base Currency',
    language: 'App Language',
    rpc: 'Custom RPC Node',
    backup: 'Recovery Mnemonic Phrase',
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.modalOverlay}>
        <View style={[styles.sheetContainer, { paddingBottom: 20 + insets.bottom }]} className="bg-surface border-t border-borderAlpha rounded-t-3xl p-5">
          {/* Header Drag Handle */}
          <View className="items-center mb-4">
            <View className="w-12 h-1.5 bg-borderAlpha rounded-full" />
          </View>

          <AppText variant="body" weight="bold" className="text-white text-center mb-6">
            {titleConfig[type]}
          </AppText>

          <ScrollView showsVerticalScrollIndicator={false}>{renderContent()}</ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    maxHeight: '75%',
  },
});

export default SettingsDetailSheet;
