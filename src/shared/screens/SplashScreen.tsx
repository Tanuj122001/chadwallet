import React, { useEffect, useRef } from 'react';
import { View, Animated, StatusBar, StyleSheet } from 'react-native';
import { AuthStackScreenProps } from '../../core/navigation/navigationTypes';
import { AppText } from '../components/AppText';
import { colors } from '../theme/colors';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

export const SplashScreen: React.FC<AuthStackScreenProps<'Splash'>> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation, fadeAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <Animated.View
        style={[
          styles.animationWrapper,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Glowing luxury logo mark */}
        <View style={styles.logoGlow} className="w-24 h-24 bg-primary items-center justify-center rounded-3xl shadow-lg">
          <FontAwesome6 name="wallet" size={40} color="#080A0C" iconStyle="solid" />
        </View>

        {/* Wordmark */}
        <AppText variant="h1" weight="bold" className="text-white tracking-[0.25em] mt-8 text-center font-mono">
          CHADWALLET
        </AppText>
        <AppText variant="caption" color="secondary" align="center" className="mt-2 tracking-wide">
          DEFI INSTIGATORS NETWORK
        </AppText>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
});

export default SplashScreen;
