import React from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { AppText } from './AppText';
import { colors } from '../theme/colors';
import { toast } from './ToastManager';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

export interface ActionsSheetProps {
  visible: boolean;
  onClose: () => void;
  onActionTrigger?: (actionName: string) => void;
}

interface ActionItem {
  icon: string;
  label: string;
  color: string;
  action: string;
}

const ACTIONS: ActionItem[] = [
  { icon: 'paper-plane', label: 'Send SOL', color: colors.primary, action: 'send' },
  { icon: 'qrcode', label: 'Receive Assets', color: colors.secondary, action: 'receive' },
  { icon: 'arrow-right-arrow-left', label: 'Quick Swap', color: colors.accent, action: 'swap' },
  { icon: 'credit-card', label: 'Buy Solana', color: colors.gains, action: 'buy' },
  { icon: 'piggy-bank', label: 'Sell Tokens', color: colors.losses, action: 'sell' },
  { icon: 'camera', label: 'Scan QR Code', color: colors.warning, action: 'scan' },
  { icon: 'folder-plus', label: 'Create Wallet', color: colors.info, action: 'create' },
  { icon: 'file-import', label: 'Import Phrase', color: colors.textSecondary, action: 'import' },
];

export const ActionsSheet: React.FC<ActionsSheetProps> = ({ visible, onClose, onActionTrigger }) => {
  const handleItemPress = (action: ActionItem) => {
    onClose();
    if (onActionTrigger) {
      onActionTrigger(action.action);
    } else {
      toast.success(`${action.label} flow initiated successfully.`);
    }
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
            Quick Wallet Operations
          </AppText>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="flex-row flex-wrap justify-between">
              {ACTIONS.map((act, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleItemPress(act)}
                  className="w-[22%] items-center mb-6"
                  activeOpacity={0.88}
                  accessibilityRole="button"
                  accessibilityLabel={act.label}
                >
                  <View
                    className="w-12 h-12 items-center justify-center rounded-full mb-2 shadow-md"
                    style={{ backgroundColor: colors.surfaceHover }}
                  >
                    <FontAwesome6 name={act.icon as any} size={18} color={act.color} iconStyle="solid" />
                  </View>
                  <AppText variant="caption" align="center" color="secondary" className="text-[10px]">
                    {act.label}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
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
    maxHeight: '60%',
  },
});

export default ActionsSheet;
