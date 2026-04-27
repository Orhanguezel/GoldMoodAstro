import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useState } from 'react';
import { storage } from '@/lib/storage';
import { colors } from '@/theme/tokens';

/**
 * Kök giriş: onboarded → (tabs) değilse → onboarding.
 */
export default function Index() {
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const onboarded = await storage.isOnboarded();
      setTarget(onboarded ? '/(tabs)' : '/onboarding');
    })();
  }, []);

  if (!target) {
    return (
      <View style={styles.wrap}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }
  return <Redirect href={target as '/(tabs)' | '/onboarding'} />;
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
});
