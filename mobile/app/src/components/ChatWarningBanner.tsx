import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme, type AppTheme } from '@/theme';

type Props = {
  compact?: boolean;
  message?: string;
  style?: object;
};

function buildStyles(t: AppTheme, compact: boolean) {
  const { colors, font, radius, spacing } = t;
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: compact ? 8 : 12,
      padding: compact ? 10 : spacing.md,
      marginHorizontal: compact ? 0 : spacing.lg,
      marginBottom: compact ? spacing.sm : spacing.md,
      borderRadius: compact ? radius.md : radius.lg,
      backgroundColor: 'rgba(240, 160, 48, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(240, 160, 48, 0.35)',
    },
    text: {
      flex: 1,
      fontFamily: font.sans,
      fontSize: compact ? 10 : 12,
      color: colors.textDim,
      lineHeight: compact ? 16 : 18,
    },
  });
}

export function ChatWarningBanner({ compact = false, message, style }: Props) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const text = message ?? t('chat.warning');
  const styles = useMemo(() => buildStyles(theme, compact), [theme, compact]);

  return (
    <View style={[styles.wrap, style]} accessibilityRole="text">
      <AlertTriangle size={compact ? 14 : 18} color={theme.colors.warning} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}
