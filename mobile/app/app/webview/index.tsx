import React, { useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, router } from 'expo-router';
import { safeRouterBack } from '@/lib/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppTheme, type AppTheme } from '@/theme';

function buildScreenStyles(t: AppTheme) {
  const { colors, font, spacing } = t;
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontFamily: font.display, fontSize: 18, color: colors.text, textAlign: 'center', marginHorizontal: 8 },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  err: { fontFamily: font.sans, fontSize: 15, color: colors.textMuted, textAlign: 'center', padding: spacing.lg },
});
}




function pickParam(v: string | string[] | undefined): string {
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && v[0]) return v[0];
  return '';
}

export default function WebViewScreen() {
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => buildScreenStyles(theme), [theme]);

  const { t } = useTranslation();
  const params = useLocalSearchParams<{ url?: string | string[]; title?: string | string[] }>();

  const url = useMemo(() => {
    const raw = pickParam(params.url).trim();
    if (!raw) return '';
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }, [params.url]);

  const title = useMemo(() => {
    const raw = pickParam(params.title).trim();
    return raw || t('navigation.webViewTitle');
  }, [params.title, t]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => safeRouterBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color={colors.gold} />
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {!url ? (
          <View style={styles.loader}>
            <Text style={styles.err}>{t('navigation.missingUrl')}</Text>
          </View>
        ) : (
          <WebView
            source={{ uri: url }}
            startInLoadingState
            originWhitelist={['*']}
            mixedContentMode="always"
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            setSupportMultipleWindows={false}
            renderLoading={() => (
              <View style={styles.loader}>
                <ActivityIndicator color={colors.gold} size="large" />
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

