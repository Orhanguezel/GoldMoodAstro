import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { 
  Calendar, 
  Clock, 
  ChevronRight, 
  Video, 
  PhoneCall,
  MessageSquare, 
  CheckCircle2, 
  Clock3, 
  AlertCircle 
} from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

import { useAppTheme, type AppTheme } from '@/theme';
import type { Booking } from '@/types';

function buildScreenStyles(t: AppTheme) {
  const { colors, spacing, font, radius } = t;
  return StyleSheet.create({
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
      color: colors.ink,
    },
  });
}

interface Props {
  booking: Booking;
  onPress: () => void;
  onJoinCall?: () => void;
  onMessage?: () => void;
}

export function BookingCard({ booking, onPress, onJoinCall, onMessage }: Props) {
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => buildScreenStyles(theme), [theme]);
  const { t } = useTranslation();

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { color: colors.success, label: t('bookingCard.statusConfirmed', 'ONAYLANDI'), icon: CheckCircle2 };
      case 'booked':
        return { color: colors.gold, label: t('bookingCard.statusPending', 'BEKLİYOR'), icon: Clock3 };
      case 'pending_payment':
        return { color: colors.warning, label: t('bookingCard.statusPendingPayment', 'ÖDEME BEKLİYOR'), icon: AlertCircle };
      case 'completed':
        return { color: colors.textMuted, label: t('bookingCard.statusCompleted', 'TAMAMLANDI'), icon: CheckCircle2 };
      case 'cancelled':
      case 'no_show':
        return { color: colors.danger, label: t('bookingCard.statusCancelled', 'İPTAL EDİLDİ'), icon: AlertCircle };
      default:
        return { color: colors.textMuted, label: status.toUpperCase(), icon: Clock3 };
    }
  };

  const config = getStatusConfig(booking.status);
  const StatusIcon = config.icon;
  const isJoinable = booking.status === 'confirmed';
  const canMessage = booking.status !== 'cancelled' && !!onMessage;

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

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {canMessage ? (
            <Pressable
              style={[styles.joinBtn, { backgroundColor: colors.inkDeep, borderWidth: 1, borderColor: colors.gold }]}
              onPress={() => onMessage?.()}
            >
              <MessageSquare size={14} color={colors.gold} />
              <Text style={[styles.joinBtnText, { color: colors.gold }]}>{t('bookingCard.message', 'Mesaj')}</Text>
            </Pressable>
          ) : null}
          {isJoinable && onJoinCall ? (
            <Pressable style={styles.joinBtn} onPress={onJoinCall}>
              <PhoneCall size={14} color={colors.ink} />
              <Text style={styles.joinBtnText}>{t('bookingCard.join', 'Katıl')}</Text>
            </Pressable>
          ) : !canMessage ? (
            <View style={styles.priceWrap}>
              <Text style={styles.priceLabel}>{t('bookingCard.priceLabel', 'Ücret:')}</Text>
              <Text style={styles.priceVal}>₺{Math.round(Number(booking.session_price))}</Text>
            </View>
          ) : (
            <View style={styles.priceWrap}>
              <Text style={styles.priceVal}>₺{Math.round(Number(booking.session_price))}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
