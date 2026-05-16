import React, { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Menu } from 'lucide-react-native';
import { router } from 'expo-router';

import { useAppTheme, type AppTheme } from '@/theme';

function buildScreenStyles(t: AppTheme) {
  const { colors } = t;
  return StyleSheet.create({
    btn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.lineSoft,
    },
  });
}

export function MenuHeaderButton() {
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => buildScreenStyles(theme), [theme]);

  return (
    <Pressable
      style={styles.btn}
      onPress={() => router.push('/menu/index' as any)}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Menü"
    >
      <Menu size={22} color={colors.gold} strokeWidth={2} />
    </Pressable>
  );
}
