import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppHeader } from '../components/AppHeader';
import { AppText } from '../components/AppText';
import { Card } from '../components/Card';
import { SecondaryButton } from '../components/SecondaryButton';
import { useAuth } from '../../core/navigation/AuthContext';
import { colors } from '../theme/colors';
import { SettingsDetailSheet, SettingsDetailType, ToastManager, toast } from '../components';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  onPress?: () => void;
}

const SettingItem: React.FC<SettingItemProps> = ({ icon, title, subtitle, rightAction, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.88}
    onPress={onPress}
    disabled={!onPress}
    className="flex-row items-center justify-between py-4 border-b border-borderAlpha last:border-b-0"
  >
    <View className="flex-row items-center flex-1">
      <View className="w-10 h-10 bg-surfaceHover items-center justify-center rounded-xl mr-4">
        <FontAwesome6 name={icon as any} size={16} color={colors.primary} iconStyle="solid" />
      </View>
      <View className="flex-1">
        <AppText variant="body" weight="semibold" color="primary">
          {title}
        </AppText>
        {subtitle && (
          <AppText variant="caption" color="secondary" className="mt-0.5">
            {subtitle}
          </AppText>
        )}
      </View>
    </View>
    {rightAction || (
      <FontAwesome6 name="chevron-right" size={14} color={colors.textMuted} iconStyle="solid" />
    )}
  </TouchableOpacity>
);

export const SettingsScreen: React.FC = () => {
  const { logout } = useAuth();
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailType, setDetailType] = useState<SettingsDetailType>('biometrics');

  const openDetail = (type: SettingsDetailType) => {
    setDetailType(type);
    setDetailVisible(true);
  };

  return (
    <ScreenContainer scrollable={false} padding={true}>
      <AppHeader
        title="Settings"
        leftAction={
          <View className="w-8 h-8 bg-primary/20 items-center justify-center rounded-lg">
            <FontAwesome6 name="gear" size={16} color={colors.primary} iconStyle="solid" />
          </View>
        }
      />
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-space-lg">
        {/* User Card Profile Header */}
        <Card className="mb-space-lg mt-space-sm flex-row items-center p-space-lg">
          <View className="w-12 h-12 bg-primary items-center justify-center rounded-full mr-4 shadow-md">
            <AppText variant="h2" weight="bold" className="text-slate-900">
              C
            </AppText>
          </View>
          <View className="flex-1">
            <AppText variant="body" weight="bold">
              Chad Wallet Account
            </AppText>
            <AppText variant="caption" color="secondary">
              Solana Mainnet Ledger
            </AppText>
          </View>
          <View className="bg-primary/20 px-3 py-1 rounded-radius-full">
            <AppText variant="caption" weight="bold" color="primary">
              Active
            </AppText>
          </View>
        </Card>

        {/* Security Section */}
        <AppText variant="caption" weight="semibold" color="secondary" className="mb-space-xs uppercase tracking-wider">
          Security & Privacy
        </AppText>
        <Card className="mb-space-lg p-0 px-space-md">
          <SettingItem
            icon="shield-halved"
            title="Biometric Protection"
            subtitle="Secure enclave fingerprint lock"
            onPress={() => openDetail('biometrics')}
            rightAction={
              <AppText variant="caption" color="primary" weight="bold">
                Enabled
              </AppText>
            }
          />
          <SettingItem
            icon="key"
            title="Export Mnemonic Key"
            subtitle="12-word master passphrase recovery"
            onPress={() => openDetail('backup')}
          />
          <SettingItem
            icon="lock"
            title="Auto Lock Timeout"
            subtitle="Lock screen after 15 minutes"
            onPress={() => openDetail('autolock')}
          />
        </Card>

        {/* System Settings Section */}
        <AppText variant="caption" weight="semibold" color="secondary" className="mb-space-xs uppercase tracking-wider">
          Preferences
        </AppText>
        <Card className="mb-space-lg p-0 px-space-md">
          <SettingItem
            icon="circle-half-stroke"
            title="Display Color Theme"
            subtitle="Midnight dark / Luxury aesthetic"
            onPress={() => toast.info('Display Color Theme locked to Midnight Dark.')}
            rightAction={
              <AppText variant="caption" color="secondary" weight="bold">
                Dark
              </AppText>
            }
          />
          <SettingItem
            icon="globe"
            title="Base Fiat Currency"
            subtitle="Display quotes in US Dollar (USD)"
            onPress={() => openDetail('currency')}
            rightAction={
              <AppText variant="caption" color="secondary" weight="bold">
                USD
              </AppText>
            }
          />
          <SettingItem
            icon="network-wired"
            title="Solana RPC Endpoint"
            subtitle="Helius premium nodes cluster"
            onPress={() => openDetail('rpc')}
          />
        </Card>

        {/* Action Sign Out Button */}
        <View className="mt-space-lg mb-space-3xl">
          <SecondaryButton title="Simulate Sign Out" onPress={logout} />
        </View>
      </ScrollView>

      <SettingsDetailSheet
        visible={detailVisible}
        type={detailType}
        onClose={() => setDetailVisible(false)}
      />
      <ToastManager />
    </ScreenContainer>
  );
};

export default SettingsScreen;
