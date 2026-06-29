import React, { useState, useEffect } from 'react';
import { View, Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText } from './AppText';
import { colors } from '../theme/colors';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

type ToastListener = (toast: ToastMessage) => void;
const listeners = new Set<ToastListener>();

export const toast = {
  show: (type: ToastType, message: string) => {
    const newToast: ToastMessage = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      message,
    };
    listeners.forEach(listener => listener(newToast));
  },
  success: (message: string) => toast.show('success', message),
  info: (message: string) => toast.show('info', message),
  warning: (message: string) => toast.show('warning', message),
  error: (message: string) => toast.show('error', message),
};

export const ToastManager: React.FC = () => {
  const [activeToast, setActiveToast] = useState<ToastMessage | null>(null);
  const slideAnim = React.useRef(new Animated.Value(-100)).current;
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissToast = React.useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setActiveToast(null);
    });
  }, [slideAnim]);

  useEffect(() => {
    const handleNewToast = (newToast: ToastMessage) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setActiveToast(newToast);
      
      // Animate slide in
      Animated.spring(slideAnim, {
        toValue: 50, // Position down from top
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }).start();

      // Auto dismiss
      timeoutRef.current = setTimeout(() => {
        dismissToast();
      }, 3500);
    };

    listeners.add(handleNewToast);
    return () => {
      listeners.delete(handleNewToast);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [slideAnim, dismissToast]);

  if (!activeToast) return null;

  const typeConfig = {
    success: { icon: 'circle-check', color: colors.gains, bg: 'bg-[#10B981]/15 border-[#10B981]/30' },
    info: { icon: 'circle-info', color: colors.info, bg: 'bg-[#0EA5E9]/15 border-[#0EA5E9]/30' },
    warning: { icon: 'triangle-exclamation', color: colors.warning, bg: 'bg-[#F59E0B]/15 border-[#F59E0B]/30' },
    error: { icon: 'circle-xmark', color: colors.losses, bg: 'bg-[#EF4444]/15 border-[#EF4444]/30' },
  };

  const { icon, color, bg } = typeConfig[activeToast.type];

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
      className={`absolute left-5 right-5 z-[9999] flex-row items-center border rounded-radius-xl p-4 shadow-lg ${bg}`}
    >
      <View className="mr-3">
        <FontAwesome6 name={icon as any} size={20} color={color} iconStyle="solid" />
      </View>
      <View className="flex-1">
        <AppText variant="bodySm" weight="semibold" className="text-white">
          {activeToast.message}
        </AppText>
      </View>
      <TouchableOpacity onPress={dismissToast} className="p-1 ml-2" accessibilityLabel="Dismiss toast">
        <FontAwesome6 name="xmark" size={14} color={colors.textSecondary} iconStyle="solid" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
});
export default ToastManager;
