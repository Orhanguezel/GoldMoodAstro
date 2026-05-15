import React, { useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { colors, font, radius, spacing } from '@/theme/tokens';

function normalizeParam(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export default function WebViewScreen() {
  const params = useLocalSearchParams<{ url: string | string[]; title?: string | string[] }>();
  const url = useMemo(() => normalizeParam(params.url), [params.url]);
  const title = useMemo(() => normalizeParam(params.title), [params.title]);

  if (!url) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <ChevronLeft size={24} color={colors.gold} />
            </Pressable>
            <Text style={styles.title}>Bağlantı yok</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.missingWrap}>
            <Text style={styles.missingText}>Görüntülenecek adres bulunamadı.</Text>
            <Pressable style={styles.missingBtn} onPress={() => router.back()}>
              <Text style={styles.missingBtnText}>Geri</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color={colors.gold} />
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>
            {title || 'Ödeme'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.webviewWrap}>
          <WebView
            style={{ flex: 1 }}
            source={{ uri: url }}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loader}>
                <ActivityIndicator color={colors.gold} size="large" />
              </View>
            )}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: font.display, fontSize: 18, color: colors.text },
  loader: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  missingWrap: { flex: 1, padding: spacing.lg, justifyContent: 'center', gap: spacing.lg },
  missingText: { fontFamily: font.sans, fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  missingBtn: {
    alignSelf: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
  },
  missingBtnText: { fontFamily: font.sansBold, fontSize: 15, color: colors.bgDeep },
  webviewWrap: { flex: 1 },
});
