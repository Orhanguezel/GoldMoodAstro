import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { colors, spacing, font, radius, shadows } from '@/theme/tokens';
import type { Booking } from '@/types';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

interface Props {
  booking: Booking;
  onPress: () => void;
  onJoinCall?: () => void;
}

export function BookingCard({ booking, onPress, onJoinCall }: Props) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'tr' ? tr : enUS;

  const statusColors = {
    pending_payment: colors.gold,
    booked: colors.gold,
    confirmed: colors.success,
    completed: colors.muted,
    cancelled: colors.danger,
    no_show: colors.danger,
  };

  const isUpcoming = ['booked', 'confirmed', 'pending_payment'].includes(booking.status);
  const isJoinable = booking.status === 'confirmed'; // Basitleştirilmiş kural

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.consultantRow}>
          {booking.consultant?.avatar_url ? (
            <Image source={{ uri: booking.consultant.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {booking.consultant?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
              </Text>
            </View>
          )}
          <View style={styles.info}>
            <Text style={styles.name}>{booking.consultant?.full_name}</Text>
            <Text style={styles.date}>
              {format(parseISO(booking.appointment_date), 'd MMMM yyyy', { locale: dateLocale })}
              {' • '}
              {booking.appointment_time?.substring(0, 5)}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[booking.status] + '20' }]}>
          <Text style={[styles.statusText, { color: statusColors[booking.status] }]}>
            {t(`booking.status.${booking.status}`)}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>{t('booking.price')}</Text>
          <Text style={styles.price}>₺{Math.round(Number(booking.session_price))}</Text>
        </View>
        
        {isJoinable && onJoinCall && (
          <Pressable style={styles.joinBtn} onPress={onJoinCall}>
            <Text style={styles.joinBtnText}>{t('bookings.joinCall')}</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  consultantRow: { flexDirection: 'row', gap: spacing.sm, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.amethyst, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: colors.stardust, fontSize: 16, fontFamily: font.sansBold },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontFamily: font.display, color: colors.stardust },
  date: { fontSize: 12, color: colors.muted, fontFamily: font.sans },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontFamily: font.sansBold, textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceContainer: { gap: 2 },
  priceLabel: { fontSize: 10, color: colors.muted, fontFamily: font.sans },
  price: { fontSize: 16, fontFamily: font.sansBold, color: colors.stardust },
  joinBtn: { backgroundColor: colors.amethyst, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill },
  joinBtnText: { color: colors.stardust, fontFamily: font.sansBold, fontSize: 13 },
});
