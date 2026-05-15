import { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, 
  ActivityIndicator, Pressable, Alert, Image, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronRight, CalendarDays } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, font, radius, shadows } from '@/theme/tokens';
import { bookingsApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { Booking } from '@/types';
import { format, parseISO } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { isAuthenticated, authHydrating } = useAuth();
  const dateLocale = i18n.language === 'tr' ? tr : enUS;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authHydrating) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    if (!id) {
      setLoading(false);
      return;
    }
    bookingsApi.get(id)
      .then(setBooking)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, authHydrating, isAuthenticated]);

  const handleCancel = () => {
    Alert.alert(
      t('booking.cancelTitle', 'Randevuyu İptal Et'),
      t('booking.cancelConfirm', 'Bu randevuyu iptal etmek istediğinize emin misiniz?'),
      [
        { text: t('common.no'), style: 'cancel' },
        { 
          text: t('common.yes'), 
          style: 'destructive', 
          onPress: async () => {
            try {
              await bookingsApi.cancel(id!);
              Alert.alert(t('common.success'), t('booking.cancelSuccess', 'Randevunuz iptal edildi.'));
              router.back();
            } catch (err: any) {
              Alert.alert(t('common.error'), err.message || 'İptal edilemedi.');
            }
          } 
        },
      ]
    );
  };

  if (authHydrating) {
    return (
      <View style={[styles.safe, styles.center]}>
        <ActivityIndicator color={colors.amethyst} size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.guestScroll}>
          <Pressable onPress={() => router.back()} style={styles.guestBack}>
            <Text style={styles.guestBackText}>{t('common.back', 'Geri')}</Text>
          </Pressable>
          <View style={styles.guestIconWrap}>
            <CalendarDays size={32} color={colors.midnight} />
          </View>
          <Text style={styles.guestTitle}>{t('booking.detailTitle', 'Randevu Detayı')}</Text>
          <Text style={styles.guestSubtitle}>
            {t(
              'booking.guestHint',
              'Randevu bilgilerinizi görmek, iptal etmek veya görüşmeye katılmak için giriş yapın.',
            )}
          </Text>
          <Pressable style={styles.guestPrimaryWrap} onPress={() => router.push('/auth/login' as any)}>
            <LinearGradient colors={[colors.amethyst, colors.gold]} style={styles.guestPrimaryBtn}>
              <Text style={styles.guestPrimaryLabel}>{t('auth.login', 'Giriş Yap')}</Text>
              <ChevronRight size={18} color={colors.stardust} />
            </LinearGradient>
          </Pressable>
          <Pressable onPress={() => router.push('/auth/register' as any)}>
            <Text style={styles.guestRegister}>{t('auth.registerCta', 'Hesap oluştur')}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <View style={[styles.safe, styles.center]}>
        <ActivityIndicator color={colors.amethyst} size="large" />
      </View>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={[styles.center, { flex: 1, padding: spacing.lg }]}>
          <Text style={{ fontFamily: font.sans, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.lg }}>
            {id ? t('booking.loadError', 'Randevu bilgisi alınamadı.') : t('booking.missingId', 'Randevu kimliği eksik.')}
          </Text>
          <Pressable onPress={() => router.back()} style={{ padding: spacing.md }}>
            <Text style={{ fontFamily: font.sansBold, color: colors.amethyst }}>{t('common.back', 'Geri')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isJoinable = booking.status === 'confirmed';
  const isCancellable = ['booked', 'confirmed', 'pending_payment'].includes(booking.status);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('booking.detailTitle', 'Randevu Detayı')}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
              {t(`booking.status.${booking.status}`)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('booking.consultant')}</Text>
          <View style={styles.consultantCard}>
            {booking.consultant?.avatar_url ? (
              <Image source={{ uri: booking.consultant.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {booking.consultant?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </Text>
              </View>
            )}
            <View style={styles.consultantInfo}>
              <Text style={styles.consultantName}>{booking.consultant?.full_name}</Text>
              <Text style={styles.expertise}>{booking.consultant?.expertise?.join(', ')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('booking.timeInfo', 'Zaman Bilgisi')}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>{t('booking.date')}</Text>
            <Text style={styles.value}>
              {format(parseISO(booking.appointment_date), 'd MMMM yyyy, EEEE', { locale: dateLocale })}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>{t('booking.time')}</Text>
            <Text style={styles.value}>{booking.appointment_time?.substring(0, 5)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>{t('booking.duration')}</Text>
            <Text style={styles.value}>{booking.session_duration} dk</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('booking.price')}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>{t('booking.total')}</Text>
            <Text style={styles.priceValue}>₺{Math.round(Number(booking.session_price))}</Text>
          </View>
        </View>

        {booking.customer_note && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('booking.note')}</Text>
            <Text style={styles.note}>{booking.customer_note}</Text>
          </View>
        )}
      </ScrollView>

        <View style={styles.footer}>
        {isJoinable && (
          <Pressable 
            style={styles.joinBtn} 
            onPress={() => router.push(`/call/${booking.id}`)}
          >
            <Text style={styles.joinBtnText}>{t('bookings.joinCall')}</Text>
          </Pressable>
        )}

        {!isJoinable && booking.status === 'completed' && (
          <Pressable
            style={styles.reviewBtn}
            onPress={() =>
              router.push({
                pathname: '/booking/[id]/review' as any,
                params: {
                  id: booking.id,
                  consultant_id: booking.consultant_id,
                  consultant_name: booking.consultant?.full_name,
                },
              })
            }
          >
            <Text style={styles.reviewBtnText}>Değerlendir</Text>
          </Pressable>
        )}
        
        {isCancellable && (
          <Pressable 
            style={styles.cancelBtn} 
            onPress={handleCancel}
          >
            <Text style={styles.cancelBtnText}>{t('booking.cancelBooking', 'Randevuyu İptal Et')}</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'confirmed': return colors.success;
    case 'completed': return colors.muted;
    case 'cancelled': case 'no_show': return colors.danger;
    default: return colors.gold;
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.midnight },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 120 },
  header: { padding: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontFamily: font.display, color: colors.stardust },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.sm },
  statusText: { fontSize: 12, fontFamily: font.sansBold, textTransform: 'uppercase' },
  section: { padding: spacing.lg, borderBottomWidth: 1, borderColor: colors.lineSoft },
  sectionTitle: { fontSize: 14, fontFamily: font.sansBold, color: colors.gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md },
  consultantCard: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.amethyst, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: colors.stardust, fontSize: 18, fontFamily: font.sansBold },
  consultantInfo: { gap: 2 },
  consultantName: { fontSize: 18, fontFamily: font.display, color: colors.stardust },
  expertise: { fontSize: 12, color: colors.muted, fontFamily: font.sans },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  label: { fontSize: 14, color: colors.muted, fontFamily: font.sans },
  value: { fontSize: 14, color: colors.stardust, fontFamily: font.sansMedium },
  priceValue: { fontSize: 18, color: colors.gold, fontFamily: font.sansBold },
  note: { fontSize: 14, color: colors.stardustDim, fontFamily: font.sans, fontStyle: 'italic', lineHeight: 20 },
  footer: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    padding: spacing.lg, gap: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1, borderColor: colors.line,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.lg
  },
  joinBtn: { backgroundColor: colors.amethyst, paddingVertical: spacing.md, borderRadius: radius.pill, alignItems: 'center', ...shadows.soft },
  joinBtnText: { color: colors.stardust, fontFamily: font.sansBold, fontSize: 16 },
  cancelBtn: { paddingVertical: spacing.md, borderRadius: radius.pill, alignItems: 'center', borderWidth: 1, borderColor: colors.danger + '40' },
  cancelBtnText: { color: colors.danger, fontFamily: font.sansBold, fontSize: 14 },
  reviewBtn: { marginTop: spacing.sm, paddingVertical: spacing.md, borderRadius: radius.pill, alignItems: 'center', backgroundColor: colors.amethyst, ...shadows.soft },
  reviewBtnText: { color: colors.stardust, fontFamily: font.sansBold, fontSize: 14 },
  guestScroll: { flexGrow: 1, padding: spacing.xl, paddingTop: spacing.lg, alignItems: 'center' },
  guestBack: { alignSelf: 'flex-start', marginBottom: spacing.lg },
  guestBackText: { fontFamily: font.sansBold, fontSize: 14, color: colors.amethyst },
  guestIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  guestTitle: { fontFamily: font.display, fontSize: 26, color: colors.stardust, textAlign: 'center', marginBottom: spacing.sm },
  guestSubtitle: { fontFamily: font.sans, fontSize: 15, color: colors.muted, textAlign: 'center', lineHeight: 22, marginBottom: spacing['2xl'] },
  guestPrimaryWrap: { alignSelf: 'stretch', borderRadius: radius.pill, overflow: 'hidden', marginBottom: spacing.md },
  guestPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  guestPrimaryLabel: { fontFamily: font.sansBold, fontSize: 15, color: colors.stardust },
  guestRegister: { fontFamily: font.sansBold, fontSize: 14, color: colors.amethyst },
});
