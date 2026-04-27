import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  ActivityIndicator, 
  Alert, 
  ScrollView, 
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { 
  ChevronLeft, 
  CreditCard, 
  Calendar, 
  Clock, 
  User, 
  ShieldCheck,
  Info,
  Sparkles
} from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

import { colors, spacing, font, radius } from '@/theme/tokens';
import { bookingsApi, ordersApi } from '@/lib/api';

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
  
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // 1. Create Booking
      const booking = await bookingsApi.create({
        consultant_id: params.consultantId!,
        resource_id: params.resourceId!,
        appointment_date: params.date!,
        appointment_time: params.time!,
        session_duration: Number(params.duration),
        session_price: params.price!,
      });

      // 2. Create Order
      const orderResult = await ordersApi.createForBooking(booking.id);

      // 3. Init Iyzipay
      const iyziResult = await ordersApi.initIyzipay(orderResult.order_id);

      // 4. Redirect to Payment (WebView)
      router.push({
        pathname: '/booking/payment' as any,
        params: {
          orderId: orderResult.order_id,
          url: iyziResult.checkout_url,
        }
      });
    } catch (err: any) {
      Alert.alert('Hata', err.message || 'Randevu oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Randevu Onayı</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Sparkles size={18} color={colors.gold} />
              <Text style={styles.summaryTitle}>SEANS ÖZETİ</Text>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <User size={18} color={colors.gold} />
              </View>
              <View style={styles.infoTextCol}>
                <Text style={styles.infoLabel}>DANIŞMAN</Text>
                <Text style={styles.infoValue}>{params.name}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Calendar size={18} color={colors.gold} />
              </View>
              <View style={styles.infoTextCol}>
                <Text style={styles.infoLabel}>TARİH</Text>
                <Text style={styles.infoValue}>
                  {format(parseISO(params.date!), 'd MMMM yyyy', { locale: tr })}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Clock size={18} color={colors.gold} />
              </View>
              <View style={styles.infoTextCol}>
                <Text style={styles.infoLabel}>SAAT & SÜRE</Text>
                <Text style={styles.infoValue}>
                  {params.time} · {params.duration} dakika
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Ödenecek Tutar</Text>
              <Text style={styles.totalValue}>₺{Math.round(Number(params.price))}</Text>
            </View>
          </View>

          {/* Trust Box */}
          <View style={styles.trustBox}>
            <View style={styles.trustHeader}>
              <ShieldCheck size={18} color={colors.success} />
              <Text style={styles.trustTitle}>Güvenli Ödeme Sistemi</Text>
            </View>
            <Text style={styles.trustText}>
              Ödemeniz Iyzipay güvencesiyle 256-bit SSL şifreleme ile gerçekleştirilir. Kart bilgileriniz hiçbir şekilde kaydedilmez.
            </Text>
          </View>

          {/* Policy Box */}
          <View style={styles.policyBox}>
            <View style={styles.policyHeader}>
              <Info size={16} color={colors.goldDeep} />
              <Text style={styles.policyTitle}>İPTAL POLİTİKASI</Text>
            </View>
            <Text style={styles.policyText}>
              Randevunuzu seans saatinden 24 saat öncesine kadar iptal ederek iade alabilirsiniz. Geç kalan seanslar için iade yapılmamaktadır.
            </Text>
          </View>

        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable 
            style={[styles.payBtn, loading && styles.payBtnDisabled]}
            onPress={handleCheckout}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.bgDeep} />
            ) : (
              <>
                <CreditCard size={20} color={colors.bgDeep} />
                <Text style={styles.payBtnText}>Ödemeyi Tamamla</Text>
              </>
            )}
          </Pressable>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
  headerTitle: { fontFamily: font.display, fontSize: 16, color: colors.text },
  scrollContent: { padding: spacing.lg, paddingBottom: 120 },
  summaryCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 24, borderWidth: 1, borderColor: colors.line, marginBottom: 20 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  summaryTitle: { fontFamily: font.sansBold, fontSize: 11, color: colors.gold, letterSpacing: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.inkDeep, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.lineSoft },
  infoTextCol: { flex: 1 },
  infoLabel: { fontFamily: font.sansBold, fontSize: 10, color: colors.textMuted, letterSpacing: 1 },
  infoValue: { fontFamily: font.display, fontSize: 18, color: colors.text, marginTop: 4 },
  divider: { height: 1, backgroundColor: colors.lineSoft, marginVertical: 20 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontFamily: font.sansBold, fontSize: 15, color: colors.text },
  totalValue: { fontFamily: font.display, fontSize: 26, color: colors.gold },
  trustBox: { backgroundColor: 'rgba(76, 175, 110, 0.05)', borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: 'rgba(76, 175, 110, 0.15)', marginBottom: 20 },
  trustHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  trustTitle: { fontFamily: font.sansBold, fontSize: 14, color: colors.success },
  trustText: { fontFamily: font.sans, fontSize: 12, color: colors.textDim, lineHeight: 18 },
  policyBox: { paddingHorizontal: 4 },
  policyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  policyTitle: { fontFamily: font.sansBold, fontSize: 11, color: colors.goldDeep, letterSpacing: 1.5 },
  policyText: { fontFamily: font.sans, fontSize: 13, color: colors.textMuted, lineHeight: 20 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.bgDeep, padding: spacing.lg, paddingBottom: Platform.OS === 'ios' ? 40 : spacing.lg, borderTopWidth: 1, borderColor: colors.line },
  payBtn: { backgroundColor: colors.gold, flexDirection: 'row', height: 60, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', gap: 12 },
  payBtnDisabled: { opacity: 0.6 },
  payBtnText: { fontFamily: font.sansBold, fontSize: 16, color: colors.bgDeep },
});
