import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { safeRouterBack } from '@/lib/navigation';
import { WebView } from 'react-native-webview';
import { X, ShieldCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useAppTheme, type AppTheme } from '@/theme';
import { siteSettingsApi } from '@/lib/api';

const FALLBACK_SUCCESS_PATTERNS = ['/siparis/basarili', '/booking/success', 'checkout=success', 'payment=success', 'status=success'];
const FALLBACK_FAILURE_PATTERNS = ['/sepet?payment=failed', '/sepet?payment=error', 'checkout=failed', 'payment=failed', 'payment=error', 'status=failure', 'status=failed'];

function buildScreenStyles(t: AppTheme) {
  const { colors, font, spacing } = t;
  return StyleSheet.create({
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
    backgroundColor: colors.surface,
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
});
}




export default function PaymentScreen() {
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => buildScreenStyles(theme), [theme]);
  const { t } = useTranslation();

  const { url } = useLocalSearchParams<{ url: string }>();
  const [loading, setLoading] = useState(true);
  const [returnPatterns, setReturnPatterns] = useState({
    success: FALLBACK_SUCCESS_PATTERNS,
    failure: FALLBACK_FAILURE_PATTERNS,
  });

  useEffect(() => {
    siteSettingsApi
      .getMobilePaymentReturnPatterns()
      .then(setReturnPatterns)
      .catch(() => {
        setReturnPatterns({
          success: FALLBACK_SUCCESS_PATTERNS,
          failure: FALLBACK_FAILURE_PATTERNS,
        });
      });
  }, []);

  const handleNavigationStateChange = (navState: any) => {
    const { url: currentUrl } = navState;
    if (!currentUrl) return;

    if (returnPatterns.success.some((pattern) => currentUrl.includes(pattern))) {
      router.replace('/(tabs)/bookings' as any);
      return;
    }

    if (returnPatterns.failure.some((pattern) => currentUrl.includes(pattern))) {
      safeRouterBack();
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <ShieldCheck size={20} color={colors.success} />
            <Text style={styles.headerTitle}>{t('payment.secureTitle', 'Güvenli Ödeme')}</Text>
          </View>
          <Pressable onPress={() => safeRouterBack()} style={styles.closeBtn}>
            <X size={24} color={colors.textMuted} />
          </Pressable>
        </View>

        <View style={styles.webviewContainer}>
          <WebView
            source={{ uri: url! }}
            onNavigationStateChange={handleNavigationStateChange}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loader}>
                <ActivityIndicator color={colors.gold} size="large" />
                <Text style={styles.loaderText}>{t('payment.loadingSecurePage', 'Güvenli ödeme sayfası yükleniyor...')}</Text>
              </View>
            )}
          />
        </View>

      </SafeAreaView>
    </View>
  );
}
