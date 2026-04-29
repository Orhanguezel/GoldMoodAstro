import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, spacing, font, radius } from '@/theme/tokens';
import { BannerSlider } from '@/components/BannerSlider';

const { width } = Dimensions.get('window');

// Star Component
const Star = ({ delay, top, left, size = 2 }: { delay: number; top: any; left: any; size?: number }) => {
  const opacity = useRef(new Animated.Value(0.1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 1500 + Math.random() * 1000,
          easing: Easing.inOut(Easing.ease),
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.1,
          duration: 1500 + Math.random() * 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity, delay]);

  return (
    <Animated.View
      style={[
        styles.star,
        {
          width: size,
          height: size,
          top,
          left,
          opacity,
        },
      ]}
    />
  );
};

export default function WelcomeScreen() {
  const rotation = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 60000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1200,
        delay: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [rotation, fadeAnim, slideAnim]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Cosmos Background */}
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[styles.orbitContainer, { transform: [{ rotate: spin }] }]}>
          <View style={styles.orbit1} />
          <View style={styles.orbit2} />
          <View style={styles.orbitPlanet1} />
        </Animated.View>

        <Star delay={0} top="12%" left="15%" size={2} />
        <Star delay={600} top="22%" left="80%" size={3} />
        <Star delay={1300} top="45%" left="8%" size={1.5} />
        <Star delay={300} top="65%" left="88%" size={2} />
        <Star delay={900} top="78%" left="25%" size={2.5} />
        <Star delay={1600} top="90%" left="65%" size={1.5} />
      </View>

      <SafeAreaView style={styles.safe}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.header}>
            <View style={styles.logoBorder}>
              <Text style={styles.logoG}>G</Text>
            </View>
            <Text style={styles.brandName}>GOLD MOOD</Text>
            <Text style={styles.brandSub}>ASTROLOGY</Text>
          </View>

          <BannerSlider placement="mobile_welcome" style={styles.welcomeBanner} />

          <View style={styles.centerText}>
            <Text style={styles.tagline}>
              Ruhunuzun derinliklerini{'\n'}
              <Text style={styles.taglineHighlight}>yıldızların</Text> ışığında{'\n'}
              keşfedin.
            </Text>
            <View style={styles.taglineDivider} />
          </View>

          <View style={styles.footer}>
            <Pressable
              onPress={() => router.push('/onboarding/birthdata' as any)}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.buttonText}>Yolculuğa Başla</Text>
            </Pressable>
            <Text style={styles.loginHint}>
              Zaten hesabınız var mı? <Text style={styles.loginLink} onPress={() => router.push('/auth/login' as any)}>Giriş Yap</Text>
            </Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  welcomeBanner: {
    marginVertical: spacing.md,
  },
  logoBorder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoG: {
    fontFamily: font.display,
    fontSize: 32,
    color: colors.gold,
    marginTop: -4,
  },
  brandName: {
    fontFamily: font.display,
    fontSize: 24,
    color: colors.text,
    letterSpacing: 4,
  },
  brandSub: {
    fontFamily: font.sansBold,
    fontSize: 10,
    color: colors.goldDeep,
    letterSpacing: 6,
    marginTop: 4,
  },

  // Center Text
  centerText: {
    alignItems: 'center',
  },
  tagline: {
    fontFamily: font.display,
    fontSize: 32,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 42,
  },
  taglineHighlight: {
    color: colors.gold,
    fontFamily: font.display, // or italic if available
  },
  taglineDivider: {
    width: 40,
    height: 1,
    backgroundColor: colors.gold,
    marginTop: 24,
    opacity: 0.5,
  },

  // Footer
  footer: {
    marginBottom: spacing.xl,
    gap: 20,
  },
  button: {
    backgroundColor: colors.gold,
    paddingVertical: 18,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontFamily: font.sansBold,
    fontSize: 16,
    color: colors.bgDeep,
    letterSpacing: 1,
  },
  loginHint: {
    fontFamily: font.sans,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  loginLink: {
    color: colors.gold,
    fontFamily: font.sansBold,
  },

  // Background Elements
  star: {
    position: 'absolute',
    backgroundColor: colors.goldLight,
    borderRadius: 999,
  },
  orbitContainer: {
    position: 'absolute',
    top: -width * 0.4,
    left: -width * 0.4,
    width: width * 1.8,
    height: width * 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbit1: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.gold,
    borderStyle: 'dashed',
    opacity: 0.1,
  },
  orbit2: {
    position: 'absolute',
    width: '65%',
    height: '65%',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.gold,
    opacity: 0.08,
  },
  orbitPlanet1: {
    position: 'absolute',
    top: '15%',
    right: '30%',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gold,
    opacity: 0.6,
  },
});
