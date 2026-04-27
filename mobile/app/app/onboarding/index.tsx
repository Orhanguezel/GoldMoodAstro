import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, spacing, font, radius } from '@/theme/tokens';

const { width, height } = Dimensions.get('window');

// Star Component
const Star = ({ delay, top, left, size = 2 }: { delay: number; top: string; left: string; size?: number }) => {
  const opacity = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 1000 + Math.random() * 1000,
          easing: Easing.inOut(Easing.ease),
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.2,
          duration: 1000 + Math.random() * 1000,
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
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Background rotation
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 40000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Fade and slide content
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        delay: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        delay: 500,
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
        {/* Decorative Orbits */}
        <Animated.View style={[styles.orbitContainer, { transform: [{ rotate: spin }] }]}>
          <View style={styles.orbit1} />
          <View style={styles.orbit2} />
          <View style={styles.orbitPlanet1} />
          <View style={styles.orbitPlanet2} />
        </Animated.View>

        {/* Twinkle Stars */}
        <Star delay={0} top="15%" left="20%" size={2} />
        <Star delay={500} top="25%" left="75%" size={3} />
        <Star delay={1200} top="40%" left="10%" size={1.5} />
        <Star delay={200} top="60%" left="85%" size={2} />
        <Star delay={800} top="75%" left="30%" size={2.5} />
        <Star delay={1500} top="85%" left="60%" size={1.5} />
      </View>

      <SafeAreaView style={styles.safe}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>GOLD MOOD</Text>
            <Text style={styles.subEyebrow}>ASTRO</Text>
          </View>

          <View style={styles.centerText}>
            <Text style={styles.tagline}>
              Yıldızlarla tanışan{'\n'}
              <Text style={styles.taglineItalic}>modern</Text> astroloji{'\n'}
              deneyimi.
            </Text>
          </View>

          <View style={styles.footer}>
            <Pressable
              onPress={() => router.push('/onboarding/birthdata')}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.buttonText}>Başla</Text>
            </Pressable>
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
    padding: spacing.xl,
    justifyContent: 'space-between',
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginTop: spacing['2xl'],
  },
  eyebrow: {
    fontFamily: font.display,
    fontSize: 28,
    color: colors.gold,
    letterSpacing: 4,
    marginBottom: 4,
  },
  subEyebrow: {
    fontFamily: font.display,
    fontSize: 12,
    color: colors.goldDeep,
    letterSpacing: 8,
  },

  // Center Text
  centerText: {
    alignItems: 'center',
  },
  tagline: {
    fontFamily: font.serif,
    fontSize: 32,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 44,
  },
  taglineItalic: {
    fontFamily: font.serif, // Add italic if you have font.serifItalic
    fontStyle: 'italic',
    color: colors.gold,
  },

  // Footer
  footer: {
    marginBottom: spacing.xl,
  },
  button: {
    backgroundColor: colors.text,
    paddingVertical: 18,
    borderRadius: radius.pill,
    alignItems: 'center',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontFamily: font.sansBold,
    fontSize: 16,
    color: colors.bg,
    letterSpacing: 1,
  },

  // Background Elements
  star: {
    position: 'absolute',
    backgroundColor: colors.goldLight,
    borderRadius: 999,
  },
  orbitContainer: {
    position: 'absolute',
    top: -width * 0.2,
    left: -width * 0.2,
    width: width * 1.4,
    height: width * 1.4,
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
    opacity: 0.2,
  },
  orbit2: {
    position: 'absolute',
    width: '75%',
    height: '75%',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.gold,
    opacity: 0.15,
  },
  orbitPlanet1: {
    position: 'absolute',
    top: '12%',
    right: '25%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },
  orbitPlanet2: {
    position: 'absolute',
    bottom: '25%',
    left: '12%',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.goldDeep,
  },
});
