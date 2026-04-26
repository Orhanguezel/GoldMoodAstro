import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { WebView } from 'react-native-webview';
import { colors } from '@/theme/tokens';
import { useState } from 'react';

export default function PaymentScreen() {
  const { url, orderId } = useLocalSearchParams<{ url: string; orderId: string }>();
  const [loading, setLoading] = useState(true);

  const handleNavigationStateChange = (navState: any) => {
    const { url: currentUrl } = navState;
    if (!currentUrl) return;

    // Backend: FRONTEND_URL/siparis/basarili?order_id=...
    if (currentUrl.includes('/siparis/basarili')) {
      router.replace('/(tabs)/bookings');
      return;
    }

    // Backend: FRONTEND_URL/sepet?payment=failed|error&order_id=...
    if (currentUrl.includes('/sepet?payment=failed') || currentUrl.includes('/sepet?payment=error')) {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
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
              <ActivityIndicator color={colors.amethyst} size="large" />
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.midnight },
  container: { flex: 1 },
  loader: { 
    position: 'absolute', 
    top: 0, left: 0, right: 0, bottom: 0, 
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.midnight 
  },
});
