import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { WebView } from 'react-native-webview';
import { X, ShieldCheck } from 'lucide-react-native';

import { colors, font, spacing } from '@/theme/tokens';

export default function PaymentScreen() {
  const { url, orderId } = useLocalSearchParams<{ url: string; orderId: string }>();
  const [loading, setLoading] = useState(true);

  const handleNavigationStateChange = (navState: any) => {
    const { url: currentUrl } = navState;
    if (!currentUrl) return;

    // Success URL from backend
    if (currentUrl.includes('/siparis/basarili')) {
      router.replace('/bookings' as any);
      return;
    }

    // Failure URL from backend
    if (currentUrl.includes('/sepet?payment=failed') || currentUrl.includes('/sepet?payment=error')) {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        
        {/* Simple Header for Payment */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <ShieldCheck size={18} color={colors.success} />
            <Text style={styles.headerTitle}>Güvenli Ödeme</Text>
          </View>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <X size={20} color={colors.textDim} />
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
              </View>
            )}
          />
        </View>

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
  header: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: font.sansBold,
    fontSize: 14,
    color: colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  webviewContainer: {
    flex: 1,
  },
  loader: { 
    position: 'absolute', 
    top: 0, left: 0, right: 0, bottom: 0, 
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.bg 
  },
});
