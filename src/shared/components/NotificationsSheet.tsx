import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { Card } from './Card';
import { colors } from '../theme/colors';
import { toast } from './ToastManager';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

export interface NotificationsSheetProps {
  visible: boolean;
  onClose: () => void;
}

interface AlertItem {
  id: string;
  category: 'security' | 'portfolio' | 'ai' | 'swap' | 'transaction' | 'price';
  title: string;
  body: string;
  unread: boolean;
  timestamp: string;
}

const INITIAL_ALERTS: AlertItem[] = [
  {
    id: '1',
    category: 'security',
    title: 'New Device Connection',
    body: 'A ledger device was connected via Bluetooth node.',
    unread: true,
    timestamp: '10m ago',
  },
  {
    id: '2',
    category: 'price',
    title: 'Solana Breakout Alert',
    body: 'SOL exceeded price limit of $148.00 (Current: $148.62).',
    unread: true,
    timestamp: '2h ago',
  },
  {
    id: '3',
    category: 'portfolio',
    title: 'Arbitrage Strategy Found',
    body: 'AI Analyst identified a 2.4% swap spread route over Jupiter.',
    unread: false,
    timestamp: '5h ago',
  },
  {
    id: '4',
    category: 'swap',
    title: 'Swap Receipt Confirmed',
    body: 'Swapped 100 USDC for 0.67 SOL. Tx Signature verified.',
    unread: false,
    timestamp: '1d ago',
  },
];

export const NotificationsSheet: React.FC<NotificationsSheetProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);

  const markAllRead = () => {
    setAlerts(alerts.map(a => ({ ...a, unread: false })));
    toast.success('Marked all alerts as read.');
  };

  const clearAll = () => {
    setAlerts([]);
    toast.info('Notifications cleared.');
  };

  const toggleRead = (id: string) => {
    setAlerts(alerts.map(a => (a.id === id ? { ...a, unread: !a.unread } : a)));
  };

  const categoryIcons = {
    security: { name: 'shield-halved', color: colors.losses },
    price: { name: 'bell', color: colors.warning },
    portfolio: { name: 'briefcase', color: colors.primary },
    ai: { name: 'wand-magic-sparkles', color: colors.accent },
    swap: { name: 'arrow-right-arrow-left', color: colors.secondary },
    transaction: { name: 'receipt', color: colors.info },
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.modalOverlay}>
        <View style={[styles.sheetContainer, { paddingBottom: 20 + insets.bottom }]} className="bg-surface border-t border-borderAlpha rounded-t-3xl p-5">
          {/* Header Drag Handle */}
          <View className="items-center mb-4">
            <View className="w-12 h-1.5 bg-borderAlpha rounded-full" />
          </View>

          {/* Title & Actions */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center">
              <AppText variant="body" weight="bold" className="text-white">
                Notification Center
              </AppText>
              {alerts.filter(a => a.unread).length > 0 && (
                <View className="w-5 h-5 bg-losses rounded-full justify-center items-center ml-2">
                  <AppText variant="caption" weight="bold" className="text-white text-[10px]">
                    {alerts.filter(a => a.unread).length}
                  </AppText>
                </View>
              )}
            </View>

            <View className="flex-row gap-x-3">
              <TouchableOpacity onPress={markAllRead}>
                <AppText variant="caption" color="primary" weight="bold">
                  Mark Read
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity onPress={clearAll}>
                <AppText variant="caption" color="secondary" weight="bold">
                  Clear All
                </AppText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Notifications Scroll */}
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            {alerts.length === 0 ? (
              <View className="items-center py-10">
                <FontAwesome6 name="bell-slash" size={32} color={colors.textMuted} iconStyle="solid" className="mb-4" />
                <AppText variant="body" color="secondary">
                  No new notifications.
                </AppText>
              </View>
            ) : (
              alerts.map(item => {
                const config = categoryIcons[item.category];
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => toggleRead(item.id)}
                    activeOpacity={0.88}
                    className="mb-3"
                  >
                    <Card
                      className={`p-space-md flex-row items-center border ${
                        item.unread ? 'border-primary/30 bg-surfaceHover/80' : 'border-borderAlpha bg-surface'
                      }`}
                    >
                      <View className="w-10 h-10 bg-surfaceHover items-center justify-center rounded-xl mr-3">
                        <FontAwesome6 name={config.name as any} size={16} color={config.color} iconStyle="solid" />
                      </View>
                      <View className="flex-1 mr-2">
                        <View className="flex-row justify-between items-center">
                          <AppText variant="bodySm" weight="bold">
                            {item.title}
                          </AppText>
                          <AppText variant="caption" color="secondary" className="text-[10px]">
                            {item.timestamp}
                          </AppText>
                        </View>
                        <AppText variant="caption" color="secondary" className="mt-0.5" numberOfLines={2}>
                          {item.body}
                        </AppText>
                      </View>
                      {item.unread && <View className="w-2.5 h-2.5 bg-primary rounded-full" />}
                    </Card>
                  </TouchableOpacity>
                );
              })
            )}
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
    height: '70%',
  },
});

export default NotificationsSheet;
