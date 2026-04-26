import { useState } from 'react';
import { 
  View, Text, StyleSheet, Pressable, 
  ActivityIndicator, Alert, ScrollView, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, spacing, font, radius, shadows } from '@/theme/tokens';
import { bookingsApi, ordersApi } from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

export default function BookingCheckoutScreen() {
  const params = useLocalSearchParams<{
    consultantId: string;
    resourceId: string;
    slotId: string;
    date: string;
    time: string;
    price: string;
    duration: string;
    name: string;
  }>();
  
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'tr' ? tr : enUS;
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // 1. Randevu oluştur
      const booking = await bookingsApi.create({
        consultant_id: params.consultantId!,
        resource_id: params.resourceId!,
        appointment_date: params.date!,
        appointment_time: params.time!,
        session_duration: Number(params.duration),
        session_price: params.price!,
      });

      // 2. Sipariş oluştur
      const orderResult = await ordersApi.createForBooking(booking.id);

      // 3. Iyzipay ödeme oturumu başlat
      const iyziResult = await ordersApi.initIyzipay(orderResult.order_id);

      // 4. Ödeme ekranına (WebView) yönlendir
      router.push({
        pathname: '/booking/payment',
        params: {
          orderId: orderResult.order_id,
          url: iyziResult.checkout_url,
        }
      });
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || t('booking.createError', 'Randevu oluşturulamadı. Lütfen tekrar deneyin.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('booking.title')}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Randevu Özeti</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Danışman</Text>
            <Text style={styles.value}>{params.name}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Tarih</Text>
            <Text style={styles.value}>
              {format(parseISO(params.date!), 'd MMMM yyyy', { locale: dateLocale })}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Saat</Text>
            <Text style={styles.value}>{params.time}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Süre</Text>
            <Text style={styles.value}>{params.duration} dakika</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.totalLabel}>{t('booking.total')}</Text>
            <Text style={styles.totalValue}>₺{Math.round(Number(params.price))}</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Ödeme işleminiz Iyzipay güvencesiyle gerçekleştirilecektir. 
            Randevu saatinizden 24 saat öncesine kadar ücretsiz iptal edebilirsiniz.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable 
          style={[styles.payBtn, loading && styles.payBtnDisabled]}
          onPress={handleCheckout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.stardust} />
          ) : (
            <Text style={styles.payBtnText}>{t('booking.proceedToPayment')}</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.midnight },
  scroll: { padding: spacing.lg },
  header: { marginBottom: spacing.lg },
  title: { fontSize: 24, fontFamily: font.display, color: colors.stardust },
  summaryCard: { 
    backgroundColor: colors.surface, 
    borderRadius: radius.sm, 
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.card
  },
  summaryTitle: { fontSize: 18, fontFamily: font.display, color: colors.stardust, marginBottom: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  label: { fontSize: 14, color: colors.muted, fontFamily: font.sans },
  value: { fontSize: 14, color: colors.stardust, fontFamily: font.sansBold },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: spacing.md },
  totalLabel: { fontSize: 16, color: colors.stardust, fontFamily: font.sansBold },
  totalValue: { fontSize: 20, color: colors.gold, fontFamily: font.sansBold },
  infoBox: { marginTop: spacing.xl, padding: spacing.md, backgroundColor: colors.deep, borderRadius: radius.xs, borderLeftWidth: 4, borderLeftColor: colors.amethyst },
  infoText: { fontSize: 12, color: colors.stardustDim, lineHeight: 18, fontFamily: font.sans },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderColor: colors.line, paddingBottom: Platform.OS === 'ios' ? 34 : spacing.lg },
  payBtn: { backgroundColor: colors.amethyst, paddingVertical: spacing.md, borderRadius: radius.pill, alignItems: 'center', ...shadows.soft },
  payBtnDisabled: { opacity: 0.7 },
  payBtnText: { color: colors.stardust, fontFamily: font.sansBold, fontSize: 16 },
});
