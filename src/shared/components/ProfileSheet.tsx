import React from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, Clipboard } from 'react-native';
import { AppText } from './AppText';
import { Card } from './Card';
import { colors } from '../theme/colors';
import { toast } from './ToastManager';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

export interface ProfileSheetProps {
  visible: boolean;
  onClose: () => void;
  onLogoutPress: () => void;
}

export const ProfileSheet: React.FC<ProfileSheetProps> = ({ visible, onClose, onLogoutPress }) => {
  const walletAddress = '9xQ3Z2W6h8U7P7r5e6F4t6r8P7Q7e5F6t6r8P7Q7e5';

  const copyAddress = () => {
    Clipboard.setString(walletAddress);
    toast.success('Wallet address copied to clipboard!');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.modalOverlay}>
        <View style={styles.sheetContainer} className="bg-surface border-t border-borderAlpha rounded-t-3xl p-5">
          {/* Header Drag Handle */}
          <View className="items-center mb-4">
            <View className="w-12 h-1.5 bg-borderAlpha rounded-full" />
          </View>

          <AppText variant="body" weight="bold" className="text-white text-center mb-6">
            My Wallet Profile
          </AppText>

          {/* User Address copy block */}
          <Card className="mb-4 flex-row items-center justify-between p-space-md bg-surfaceHover border-borderAlpha">
            <View className="flex-1 mr-4">
              <AppText variant="caption" color="secondary" className="uppercase">
                Solana Address
              </AppText>
              <AppText variant="bodySm" weight="semibold" numberOfLines={1} className="text-white mt-0.5">
                {walletAddress}
              </AppText>
            </View>
            <TouchableOpacity onPress={copyAddress} className="w-9 h-9 bg-surface items-center justify-center rounded-lg border border-borderAlpha">
              <FontAwesome6 name="copy" size={14} color={colors.primary} iconStyle="solid" />
            </TouchableOpacity>
          </Card>

          {/* Backup Status and Security Score */}
          <View className="flex-row justify-between mb-6">
            <Card className="w-[48%] p-space-md">
              <AppText variant="caption" color="secondary">Backup Status</AppText>
              <View className="flex-row items-center mt-1">
                <View className="w-2 h-2 bg-gains rounded-full mr-1.5" />
                <AppText variant="bodySm" weight="bold" color="gains">Secured</AppText>
              </View>
            </Card>

            <Card className="w-[48%] p-space-md">
              <AppText variant="caption" color="secondary">Security Score</AppText>
              <View className="flex-row items-center mt-1">
                <FontAwesome6 name="shield-halved" size={12} color={colors.primary} iconStyle="solid" className="mr-1.5" />
                <AppText variant="bodySm" weight="bold" className="text-white">98/100</AppText>
              </View>
            </Card>
          </View>

          {/* Support and Terms list links */}
          <View className="mb-6 border-t border-b border-borderAlpha py-2">
            <TouchableOpacity onPress={() => toast.info('Support node activated.')} className="flex-row items-center justify-between py-3">
              <View className="flex-row items-center">
                <FontAwesome6 name="circle-question" size={16} color={colors.textSecondary} iconStyle="solid" className="mr-3" />
                <AppText variant="bodySm" weight="semibold">Help & Support</AppText>
              </View>
              <FontAwesome6 name="chevron-right" size={12} color={colors.textMuted} iconStyle="solid" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => toast.info('Privacy policy document opened.')} className="flex-row items-center justify-between py-3">
              <View className="flex-row items-center">
                <FontAwesome6 name="user-shield" size={16} color={colors.textSecondary} iconStyle="solid" className="mr-3" />
                <AppText variant="bodySm" weight="semibold">Privacy Policy</AppText>
              </View>
              <FontAwesome6 name="chevron-right" size={12} color={colors.textMuted} iconStyle="solid" />
            </TouchableOpacity>
          </View>

          {/* Logout Action */}
          <TouchableOpacity
            onPress={() => {
              onClose();
              onLogoutPress();
            }}
            className="w-full h-12 bg-losses/20 border border-losses/30 rounded-radius-xl justify-center items-center mb-4"
            activeOpacity={0.88}
          >
            <AppText variant="body" weight="bold" color="losses">
              Sign Out Wallet
            </AppText>
          </TouchableOpacity>
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
    maxHeight: '65%',
  },
});

export default ProfileSheet;
