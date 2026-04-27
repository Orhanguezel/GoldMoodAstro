import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { 
  Calendar, 
  Clock, 
  ChevronRight, 
  Video, 
  PhoneCall, 
  CheckCircle2, 
  Clock3, 
  AlertCircle 
} from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

import { colors, spacing, font, radius } from '@/theme/tokens';
import type { Booking } from '@/types';

interface Props {
  booking: Booking;
  onPress: () => void;
  onJoinCall?: () => void;
}

export function BookingCard({ booking, onPress, onJoinCall }: Props) {
  
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { color: colors.success, label: 'ONAYLANDI', icon: CheckCircle2 };
      case 'booked':
        return { color: colors.gold, label: 'BEKLİYOR', icon: Clock3 };
      case 'pending_payment':
        return { color: colors.warning, label: 'ÖDEME BEKLİYOR', icon: AlertCircle };
      case 'completed':
        return { color: colors.textMuted, label: 'TAMAMLANDI', icon: CheckCircle2 };
      case 'cancelled':
      case 'no_show':
        return { color: colors.danger, label: 'İPTAL EDİLDİ', icon: AlertCircle };
      default:
        return { color: colors.textMuted, label: status.toUpperCase(), icon: Clock3 };
    }
  };

  const config = getStatusConfig(booking.status);
  const StatusIcon = config.icon;
  const isJoinable = booking.status === 'confirmed';

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.consultantArea}>
          {booking.consultant?.avatar_url ? (
            <Image source={{ uri: booking.consultant.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{booking.consultant?.full_name?.[0]}</Text>
            </View>
          )}
          <View style={styles.consultantInfo}>
            <Text style={styles.consultantName}>{booking.consultant?.full_name}</Text>
            <View style={styles.dateTimeRow}>
              <Calendar size={12} color={colors.textMuted} />
              <Text style={styles.dateTimeText}>
                {format(parseISO(booking.appointment_date), 'd MMMM yyyy', { locale: tr })}
              </Text>
              <Clock size={12} color={colors.textMuted} />
              <Text style={styles.dateTimeText}>{booking.appointment_time?.substring(0, 5)}</Text>
            </View>
          </View>
        </View>
        <ChevronRight size={20} color={colors.line} />
      </View>

      <View style={styles.divider} />

      <View style={styles.cardFooter}>
        <View style={styles.statusWrap}>
          <StatusIcon size={14} color={config.color} />
          <Text style={[styles.statusLabel, { color: config.color }]}>{config.label}</Text>
        </View>

        {isJoinable && onJoinCall ? (
          <Pressable style={styles.joinBtn} onPress={onJoinCall}>
            <PhoneCall size={14} color={colors.bgDeep} />
            <Text style={styles.joinBtnText}>Görüşmeye Katıl</Text>
          </Pressable>
        ) : (
          <View style={styles.priceWrap}>
            <Text style={styles.priceLabel}>Ücret:</Text>
            <Text style={styles.priceVal}>₺{Math.round(Number(booking.session_price))}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  consultantArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.inkDeep,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  avatarInitials: {
    fontFamily: font.display,
    fontSize: 20,
    color: colors.gold,
  },
  consultantInfo: {
    gap: 4,
  },
  consultantName: {
    fontFamily: font.display,
    fontSize: 16,
    color: colors.text,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateTimeText: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.lineSoft,
    marginVertical: spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusLabel: {
    fontFamily: font.sansBold,
    fontSize: 10,
    letterSpacing: 1,
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceLabel: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.textMuted,
  },
  priceVal: {
    fontFamily: font.sansBold,
    fontSize: 14,
    color: colors.gold,
  },
  joinBtn: {
    backgroundColor: colors.gold,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  joinBtnText: {
    fontFamily: font.sansBold,
    fontSize: 12,
    color: colors.bgDeep,
  },
});
