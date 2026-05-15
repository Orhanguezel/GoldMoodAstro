import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { WebView } from 'react-native-webview';
import { X, ShieldCheck } from 'lucide-react-native';

import { colors, font, spacing } from '@/theme/tokens';

function normalizeParam(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export default function PaymentScreen() {
  const params = useLocalSearchParams<{ url: string | string[] }>();
  const url = useMemo(() => normalizeParam(params.url), [params.url]);
  const [loading, setLoading] = useState(!!url);

  const handleNavigationStateChange = (navState: any) => {
    const { url: currentUrl } = navState;
    if (!currentUrl) return;

    if (currentUrl.includes('/siparis/basarili')) {
      router.replace('/(tabs)/bookings' as any);
      return;
    }

    if (currentUrl.includes('/sepet?payment=failed') || currentUrl.includes('/sepet?payment=error')) {
      router.back();
    }
  };

  if (!url) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <ShieldCheck size={20} color={colors.warning} />
              <Text style={styles.headerTitle}>Ödeme bağlantısı yok</Text>
            </View>
            <Pressable onPress={() => router.back()} style={styles.closeBtn}>
              <X size={24} color={colors.textMuted} />
            </Pressable>
          </View>
          <View style={styles.missingWrap}>
            <Text style={styles.missingText}>Geçerli bir ödeme adresi bulunamadı. Randevu akışından tekrar deneyin.</Text>
            <Pressable style={styles.missingBtn} onPress={() => router.replace('/(tabs)/bookings' as any)}>
              <Text style={styles.missingBtnText}>Randevulara dön</Text>
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
          <View style={styles.headerLeft}>
            <ShieldCheck size={20} color={colors.success} />
            <Text style={styles.headerTitle}>Güvenli Ödeme</Text>
          </View>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <X size={24} color={colors.textMuted} />
          </Pressable>
        </View>

        <View style={styles.webviewContainer}>
          <WebView
            style={{ flex: 1 }}
            source={{ uri: url }}
            onNavigationStateChange={handleNavigationStateChange}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loader}>
                <ActivityIndicator color={colors.gold} size="large" />
                <Text style={styles.loaderText}>Güvenli ödeme sayfası yükleniyor...</Text>
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
  header: {
    height: 64,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.bgDeep,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontFamily: font.sansBold, fontSize: 14, color: colors.text, letterSpacing: 0.5 },
  closeBtn: { padding: 4 },
  webviewContainer: { flex: 1 },
  loader: { 
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.bg,
    gap: 16
  },
  loaderText: {
    fontFamily: font.sansMedium,
    fontSize: 13,
    color: colors.textMuted,
  },
  missingWrap: { flex: 1, padding: spacing.lg, justifyContent: 'center', gap: spacing.lg },
  missingText: { fontFamily: font.sans, fontSize: 15, color: colors.textMuted, lineHeight: 22, textAlign: 'center' },
  missingBtn: {
    alignSelf: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: 999,
    backgroundColor: colors.gold,
  },
  missingBtnText: { fontFamily: font.sansBold, fontSize: 15, color: colors.bgDeep },
});
