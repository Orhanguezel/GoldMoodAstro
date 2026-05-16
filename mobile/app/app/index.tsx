import { useEffect, useMemo, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { storage } from '@/lib/storage';

import { useAppTheme, type AppTheme } from '@/theme';

function buildScreenStyles(t: AppTheme) {
  const { colors } = t;
  return StyleSheet.create({
    wrap: {
      flex: 1,
      backgroundColor: colors.bg,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}

/**
 * Kök giriş: onboarded → (tabs) değilse → onboarding.
 */
export default function Index() {
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => buildScreenStyles(theme), [theme]);

  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const onboarded = await storage.isOnboarded();
      setTarget(onboarded ? '/(tabs)/today' : '/onboarding');
    })();
  }, []);

  if (!target) {
    return (
      <View style={styles.wrap}>
        <ActivityIndicator color={theme.colors.gold} />
      </View>
    );
  }
  return <Redirect href={target as '/(tabs)/today' | '/onboarding'} />;
}

