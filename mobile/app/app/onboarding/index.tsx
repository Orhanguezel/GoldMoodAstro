import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Animated, Easing, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { PromoBannerSection } from '@/components/PromoBannerSection';
import { storage } from '@/lib/storage';

import { useAppTheme, type AppTheme } from '@/theme';

function buildScreenStyles(t: AppTheme) {
  const { colors, spacing, font, radius } = t;
  return StyleSheet.create({
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
  taglineBody: {
    fontFamily: font.sans,
    fontSize: 16,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 23,
    marginTop: spacing.md,
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
    gap: spacing.sm,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 44,
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
    color: colors.ink,
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
  guestButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestText: {
    fontFamily: font.sansMedium,
    fontSize: 14,
    color: colors.textDim,
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
}


const { width } = Dimensions.get('window');

function TwinkleStar({
  delay,
  top,
  left,
  size = 2,
  baseStyle,
}: {
  delay: number;
  top: ViewStyle['top'];
  left: ViewStyle['left'];
  size?: number;
  baseStyle: ViewStyle;
}) {
  const [opacity] = useState(() => new Animated.Value(0.1));

  useEffect(() => {
    const animation = Animated.loop(
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
    );
    animation.start();
    return () => animation.stop();
  }, [opacity, delay]);

  return (
    <Animated.View
      style={[
        baseStyle,
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
}

export default function WelcomeScreen() {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => buildScreenStyles(theme), [theme]);

  const [rotation] = useState(() => new Animated.Value(0));
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(40));

  useEffect(() => {
    const orbit = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 60000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    orbit.start();

    const entrance = Animated.parallel([
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
    ]);
    entrance.start();
    return () => {
      orbit.stop();
      entrance.stop();
    };
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

        <TwinkleStar delay={0} top="12%" left="15%" size={2} baseStyle={styles.star} />
        <TwinkleStar delay={600} top="22%" left="80%" size={3} baseStyle={styles.star} />
        <TwinkleStar delay={1300} top="45%" left="8%" size={1.5} baseStyle={styles.star} />
        <TwinkleStar delay={300} top="65%" left="88%" size={2} baseStyle={styles.star} />
        <TwinkleStar delay={900} top="78%" left="25%" size={2.5} baseStyle={styles.star} />
        <TwinkleStar delay={1600} top="90%" left="65%" size={1.5} baseStyle={styles.star} />
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

          <PromoBannerSection placement="mobile_welcome" style={styles.welcomeBanner} />

          <View style={styles.centerText}>
            <Text style={styles.tagline}>{t('onboarding.title1')}</Text>
            <Text style={styles.taglineBody}>{t('onboarding.body1')}</Text>
            <View style={styles.taglineDivider} />
          </View>

          <View style={styles.footer}>
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                router.push({
                  pathname: '/auth/register',
                  params: { next: '/onboarding/birthdata' },
                });
              }}
              accessibilityRole="button"
              accessibilityLabel={t('onboarding.finish')}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.buttonText}>{t('onboarding.finish')}</Text>
            </Pressable>
            <View style={styles.loginRow}>
              <Text style={styles.loginHint}>{t('auth.hasAccount')}</Text>
              <Pressable
                onPress={() => router.push({
                  pathname: '/auth/login',
                  params: { next: '/onboarding/birthdata' },
                })}
                accessibilityRole="button"
                accessibilityLabel={t('auth.loginShort')}
                hitSlop={10}
              >
                <Text style={[styles.loginHint, styles.loginLink]}>{t('auth.loginShort')}</Text>
              </Pressable>
            </View>
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                void storage.markOnboarded()
                  .catch(() => {})
                  .finally(() => router.replace('/(tabs)/today'));
              }}
              accessibilityRole="button"
              accessibilityLabel={t('onboarding.continueAsGuest')}
              style={styles.guestButton}
            >
              <Text style={styles.guestText}>{t('onboarding.continueAsGuest')}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
