import React, { useMemo, useState } from 'react';
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
import { useAppTheme, type AppTheme } from '@/theme';

function buildScreenStyles(t: AppTheme) {
  const { colors, spacing, font, radius } = t;
  return StyleSheet.create({
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
  promoInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.lineSoft, height: 48 },
  promoInputDisabled: { opacity: 0.8 },
  promoInput: { flex: 1, paddingHorizontal: 12, fontFamily: font.sansMedium, fontSize: 14, color: colors.text },
  clearCoupon: { padding: 10 },
  applyBtn: { backgroundColor: colors.gold, paddingHorizontal: 16, borderRadius: radius.md, justifyContent: 'center', height: 48 },
  applyBtnDisabled: { opacity: 0.5 },
  applyBtnText: { fontFamily: font.sansBold, fontSize: 12, color: colors.ink },

  trustBox: { backgroundColor: 'rgba(76, 175, 110, 0.05)', borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: 'rgba(76, 175, 110, 0.15)', marginBottom: 20 },
  trustHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  trustTitle: { fontFamily: font.sansBold, fontSize: 14, color: colors.success },
  trustText: { fontFamily: font.sans, fontSize: 12, color: colors.textDim, lineHeight: 18 },
  policyBox: { paddingHorizontal: 4 },
  policyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  policyTitle: { fontFamily: font.sansBold, fontSize: 11, color: colors.goldDeep, letterSpacing: 1.5 },
  policyText: { fontFamily: font.sans, fontSize: 13, color: colors.textMuted, lineHeight: 20 },
  disclaimerText: { fontFamily: font.sans, fontSize: 11, fontStyle: 'italic', color: colors.textMuted, lineHeight: 16, paddingHorizontal: 4, marginTop: 20 },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 4, marginTop: 14 },
  consentCheckbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  consentCheckboxOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  consentText: { flex: 1, fontFamily: font.sans, fontSize: 12, color: colors.textDim, lineHeight: 18 },
  consentLink: { color: colors.gold, textDecorationLine: 'underline' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, padding: spacing.lg, paddingBottom: Platform.OS === 'ios' ? 40 : spacing.lg, borderTopWidth: 1, borderColor: colors.line },
  payBtn: { backgroundColor: colors.gold, flexDirection: 'row', height: 60, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', gap: 12 },
  payBtnDisabled: { opacity: 0.6 },
  payBtnText: { fontFamily: font.sansBold, fontSize: 16, color: colors.ink },
  });
}

import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { safeRouterBack } from '@/lib/navigation';
import { useTranslation } from 'react-i18next';
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
  X,
  Video,
  Mic,
} from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';


import { bookingsApi, ordersApi, campaignsApi } from '@/lib/api';
import type { Campaign } from '@/types';

export default function BookingCheckoutScreen() {
  const theme = useAppTheme();
  const { colors } = theme;  const styles = useMemo(() => buildScreenStyles(theme), [theme]);
  const { t } = useTranslation();

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
    serviceId?: string;
    serviceName?: string;
    free?: string;
    mediaType?: string;
  }>();

  const sessionMedia =
    params.mediaType === 'video' ? ('video' as const) : ('audio' as const);

  const isFreeService = params.free === '1' || Number(params.price || 0) === 0;
  
  const [loading, setLoading] = useState(false);
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [consent3, setConsent3] = useState(false);
  const allConsent = consent1 && consent2 && consent3;
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
        Alert.alert(t('common.error'), res.message || t('checkout.couponInvalid', 'Geçersiz kupon kodu.'));
      }
    } catch (err: any) {
      Alert.alert(t('common.error'), t('checkout.couponError', 'Kupon uygulanırken bir sorun oluştu.'));
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!allConsent) {
      Alert.alert(
        t('common.error'),
        t('checkout.consentRequired', 'Devam etmek için tüm onay kutularını işaretleyin.'),
      );
      return;
    }
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
        withdrawal_consent: true,
        ...(params.mediaType ? { media_type: sessionMedia } : {}),
        ...(params.serviceId ? { service_id: params.serviceId } : {}),
        source_type: sourceMatch ? 'daily_reading' : undefined,
        source_id: sourceMatch?.[1],
      });

      if (booking.status === 'confirmed' || isFreeService) {
        router.replace({
          pathname: '/booking/success' as any,
          params: { bookingId: booking.id },
        });
        return;
      }

      const orderResult = await ordersApi.createForBooking(booking.id);
      const iyziResult = await ordersApi.initIyzipay(orderResult.order_id);

      router.push({
        pathname: '/booking/payment' as any,
        params: {
          orderId: orderResult.order_id,
          url: iyziResult.checkout_url,
        },
      });
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || t('checkout.bookingCreateFailed', 'Randevu oluşturulamadı. Lütfen tekrar deneyin.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => safeRouterBack()} style={styles.headerBtn}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('checkout.title', 'Randevu Onayı')}</Text>
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

            {params.serviceName ? (
              <View style={styles.infoRow}>
                <View style={styles.iconBox}>
                  <Sparkles size={18} color={colors.gold} />
                </View>
                <View style={styles.infoTextCol}>
                  <Text style={styles.infoLabel}>HİZMET</Text>
                  <Text style={styles.infoValue}>{params.serviceName}</Text>
                </View>
              </View>
            ) : null}

            {params.mediaType ? (
              <View style={styles.infoRow}>
                <View style={styles.iconBox}>
                  {sessionMedia === 'video' ? (
                    <Video size={18} color={colors.gold} />
                  ) : (
                    <Mic size={18} color={colors.gold} />
                  )}
                </View>
                <View style={styles.infoTextCol}>
                  <Text style={styles.infoLabel}>GÖRÜŞME TÜRÜ</Text>
                  <Text style={styles.infoValue}>
                    {sessionMedia === 'video' ? t('booking.mediaVideo', 'Görüntülü') : t('booking.mediaAudio', 'Sesli')}
                  </Text>
                </View>
              </View>
            ) : null}

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

          {!isFreeService ? (
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
                    <ActivityIndicator size="small" color={colors.ink} />
                  ) : (
                    <Text style={styles.applyBtnText}>UYGULA</Text>
                  )}
                </Pressable>
              )}
            </View>
          </View>
          ) : null}

          {/* Trust Box */}
          <View style={styles.trustBox}>
            <View style={styles.trustHeader}>
              <ShieldCheck size={18} color={colors.success} />
              <Text style={styles.trustTitle}>Güvenli Ödeme Sistemi</Text>
            </View>
            <Text style={styles.trustText}>
              {isFreeService
                ? t('checkout.trustFree', 'Ücretsiz tanışma görüşmeniz onaylandığında randevularım sekmesinden takip edebilirsiniz.')
                : t('checkout.trustPaid', 'Ödemeniz Iyzipay güvencesiyle 256-bit SSL şifreleme ile gerçekleştirilir. Kart bilgileriniz hiçbir şekilde kaydedilmez.')}
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

          {/* Feragat metni */}
          <Text style={styles.disclaimerText}>
            {t('checkout.disclaimer', 'Bu hizmet; eğlence, kişisel farkındalık ve kişisel değerlendirme amacıyla sunulan çevrim içi danışmanlık hizmetidir. Kesin gelecek tahmini, garanti sonuç, sağlık teşhisi, tedavi önerisi, hukuki danışmanlık, yatırım tavsiyesi, bahis tahmini, büyü, ritüel veya benzeri vaatler içermez. Hizmet başladıktan sonra cayma hakkı kullanılamaz.')}
          </Text>

          {/* Mesafeli satış onay kutuları — 3 ayrı, hepsi zorunlu (Mesafeli Söz. Yön. m.15/1-ğ) */}
          <Pressable style={styles.consentRow} onPress={() => setConsent1((v) => !v)}>
            <View style={[styles.consentCheckbox, consent1 && styles.consentCheckboxOn]}>
              {consent1 ? <Check size={16} color={colors.ink} /> : null}
            </View>
            <Text style={styles.consentText}>
              <Text style={styles.consentLink} onPress={() => router.push('/cms/pre_information' as any)}>
                {t('checkout.preInfoLink', 'Ön Bilgilendirme Formu')}
              </Text>
              {t('checkout.consentMid', '’nu ve ')}
              <Text style={styles.consentLink} onPress={() => router.push('/cms/distance_sales' as any)}>
                {t('checkout.distanceLink', 'Mesafeli Hizmet Sözleşmesi')}
              </Text>
              {t('checkout.consent1', '’ni okudum, anladım ve kabul ediyorum.')}
            </Text>
          </Pressable>
          <Pressable style={styles.consentRow} onPress={() => setConsent2((v) => !v)}>
            <View style={[styles.consentCheckbox, consent2 && styles.consentCheckboxOn]}>
              {consent2 ? <Check size={16} color={colors.ink} /> : null}
            </View>
            <Text style={styles.consentText}>
              {t('checkout.consent2', 'Satın aldığım hizmetin çevrim içi danışmanlık hizmeti olduğunu; eğlence, kişisel farkındalık ve kişisel değerlendirme amacı taşıdığını; kesin sonuç, sağlık, hukuk, finans, yatırım veya gelecek garantisi içermediğini kabul ediyorum.')}
            </Text>
          </Pressable>
          <Pressable style={styles.consentRow} onPress={() => setConsent3((v) => !v)}>
            <View style={[styles.consentCheckbox, consent3 && styles.consentCheckboxOn]}>
              {consent3 ? <Check size={16} color={colors.ink} /> : null}
            </View>
            <Text style={styles.consentText}>
              {t('checkout.consent3', 'Hizmetin ifasına randevu saatinde başlanmasını açıkça onaylıyorum. Hizmet başladıktan sonra Mesafeli Sözleşmeler Yönetmeliği kapsamında cayma hakkımı kullanamayacağımı bildiğimi kabul ediyorum.')}
            </Text>
          </Pressable>

        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable
            style={[styles.payBtn, (loading || !allConsent) && styles.payBtnDisabled]}
            onPress={handleCheckout}
            disabled={loading || !allConsent}
          >
            {loading ? (
              <ActivityIndicator color={colors.ink} />
            ) : (
              <>
                {isFreeService ? (
                  <Calendar size={20} color={colors.ink} />
                ) : (
                  <CreditCard size={20} color={colors.ink} />
                )}
                <Text style={styles.payBtnText}>
                  {isFreeService ? t('booking.confirm') : t('checkout.completePayment', 'Ödemeyi Tamamla')}
                </Text>
              </>
            )}
          </Pressable>
        </View>

      </SafeAreaView>
    </View>
  );
}

