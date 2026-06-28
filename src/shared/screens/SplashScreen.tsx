import React, { useEffect, useRef } from 'react';
import { View, Animated, StatusBar, StyleSheet } from 'react-native';
import { AuthStackScreenProps } from '../../core/navigation/navigationTypes';
import { AppText } from '../components/AppText';
import { Logo } from '../components/Logo';

export const SplashScreen: React.FC<AuthStackScreenProps<'Splash'>> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Run parallel animations: fade-in and scale (0.95 to 1.0)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto navigate after 2000ms (fits the 1800-2200ms duration requirement)
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
        {/* Brand new Logo component utilizing the founder asset */}
        <Logo variant="dark" size={100} />

        {/* Brand name wordmark */}
        <AppText variant="h2" weight="bold" className="text-white tracking-[0.25em] mt-8 text-center font-mono">
          CHADWALLET
        </AppText>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SplashScreen;
