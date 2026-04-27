import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { WebView } from 'react-native-webview';
import { X, ShieldCheck } from 'lucide-react-native';

import { colors, font, spacing } from '@/theme/tokens';

export default function PaymentScreen() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const [loading, setLoading] = useState(true);

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
});
