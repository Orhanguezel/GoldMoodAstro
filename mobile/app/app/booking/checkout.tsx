import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  ActivityIndicator, 
  Alert, 
  ScrollView, 
  Platform,
  TextInput 
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
  Sparkles,
  Tag, 
  Check, 
  X
} from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

import { colors, spacing, font, radius } from '@/theme/tokens';
import { bookingsApi, ordersApi, campaignsApi } from '@/lib/api';
import type { Campaign } from '@/types';

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
    topic?: string;
  }>();
  
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCampaign, setAppliedCampaign] = useState<Campaign | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const originalPrice = Number(params.price || 0);
  let finalPrice = originalPrice;
  let discountAmount = 0;

  if (appliedCampaign) {
    if (appliedCampaign.type === 'discount_percentage') {
      discountAmount = (originalPrice * Number(appliedCampaign.value)) / 100;
    } else if (appliedCampaign.type === 'discount_fixed') {
      discountAmount = Number(appliedCampaign.value);
    }
    finalPrice = Math.max(0, originalPrice - discountAmount);
  }

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setCouponLoading(true);
    try {
      const res = await campaignsApi.redeem({ 
        code: couponCode, 
        applies_to: 'consultant_booking' 
      });
      if (res.valid) {
        setAppliedCampaign(res.campaign);
      } else {
        Alert.alert('Hata', res.message || 'Geçersiz kupon kodu.');
      }
    } catch (err: any) {
      Alert.alert('Hata', 'Kupon uygulanırken bir sorun oluştu.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // 1. Create Booking
      const sourceMatch = typeof params.topic === 'string'
        ? params.topic.match(/^daily_reading_([0-9a-f-]{36})$/i)
        : null;
      const booking = await bookingsApi.create({
        consultant_id: params.consultantId!,
        resource_id: params.resourceId!,
        appointment_date: params.date!,
        appointment_time: params.time!,
        session_duration: Number(params.duration),
        session_price: params.price!,
        source_type: sourceMatch ? 'daily_reading' : undefined,
        source_id: sourceMatch?.[1],
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

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Seans Ücreti</Text>
              <Text style={styles.priceVal}>₺{Math.round(originalPrice)}</Text>
            </View>

            {appliedCampaign && (
              <View style={styles.priceRow}>
                <Text style={styles.discountLabel}>İndirim ({appliedCampaign.code})</Text>
                <Text style={styles.discountVal}>-₺{Math.round(discountAmount)}</Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Ödenecek Tutar</Text>
              <Text style={styles.totalValue}>₺{Math.round(finalPrice)}</Text>
            </View>
          </View>

          {/* Promo Code */}
          <View style={styles.promoCard}>
            <Text style={styles.promoLabel}>KUPON KODU</Text>
            <View style={styles.promoInputRow}>
              <View style={[styles.promoInputWrap, appliedCampaign && styles.promoInputDisabled]}>
                <Tag size={16} color={colors.goldDim} style={{ marginLeft: 12 }} />
                <TextInput
                  style={styles.promoInput}
                  placeholder="Kupon girin..."
                  placeholderTextColor={colors.textMuted}
                  value={couponCode}
                  onChangeText={(v) => setCouponCode(v.toUpperCase())}
                  autoCapitalize="characters"
                  editable={!appliedCampaign && !couponLoading}
                />
                {appliedCampaign && (
                  <Pressable 
                    onPress={() => { setAppliedCampaign(null); setCouponCode(''); }}
                    style={styles.clearCoupon}
                  >
                    <X size={16} color={colors.danger} />
                  </Pressable>
                )}
              </View>
              {!appliedCampaign && (
                <Pressable 
                  style={[styles.applyBtn, (!couponCode || couponLoading) && styles.applyBtnDisabled]}
                  onPress={handleApplyCoupon}
                  disabled={!couponCode || couponLoading}
                >
                  {couponLoading ? (
                    <ActivityIndicator size="small" color={colors.bgDeep} />
                  ) : (
                    <Text style={styles.applyBtnText}>UYGULA</Text>
                  )}
                </Pressable>
              )}
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
  
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  priceLabel: { fontFamily: font.sans, fontSize: 14, color: colors.textDim },
  priceVal: { fontFamily: font.sansMedium, fontSize: 14, color: colors.text },
  discountLabel: { fontFamily: font.sansMedium, fontSize: 14, color: colors.success },
  discountVal: { fontFamily: font.sansBold, fontSize: 14, color: colors.success },

  promoCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 20, borderWidth: 1, borderColor: colors.line, marginBottom: 20 },
  promoLabel: { fontFamily: font.sansBold, fontSize: 10, color: colors.gold, letterSpacing: 1.5, marginBottom: 12 },
  promoInputRow: { flexDirection: 'row', gap: 10 },
  promoInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgDeep, borderRadius: radius.md, borderWidth: 1, borderColor: colors.lineSoft, height: 48 },
  promoInputDisabled: { opacity: 0.8 },
  promoInput: { flex: 1, paddingHorizontal: 12, fontFamily: font.sansMedium, fontSize: 14, color: colors.text },
  clearCoupon: { padding: 10 },
  applyBtn: { backgroundColor: colors.gold, paddingHorizontal: 16, borderRadius: radius.md, justifyContent: 'center', height: 48 },
  applyBtnDisabled: { opacity: 0.5 },
  applyBtnText: { fontFamily: font.sansBold, fontSize: 12, color: colors.bgDeep },

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
