import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useAppTheme, type AppTheme } from '@/theme';
import type { Consultant } from '@/types';
import { useTranslation } from 'react-i18next';

function buildScreenStyles(t: AppTheme) {
  const { colors, spacing, font, radius, shadows } = t;
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.sm,
      padding: spacing.md,
      marginBottom: spacing.md,
      ...shadows.card,
      borderWidth: 1,
      borderColor: colors.line,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    avatarContainer: { position: 'relative' },
    avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.deep },
    avatarPlaceholder: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.amethyst,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitials: { color: colors.stardust, fontSize: 20, fontFamily: font.sansBold },
    badge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      backgroundColor: colors.gold,
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.surface,
    },
    badgeIcon: { color: colors.midnight, fontSize: 10, fontWeight: 'bold' },
    onlineDot: {
      position: 'absolute',
      top: -2,
      right: -2,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.success,
      borderWidth: 2,
      borderColor: colors.surface,
    },
    info: { flex: 1, gap: 4 },
    name: { fontSize: 18, fontFamily: font.display, color: colors.stardust },
    expertiseRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    expertiseTag: {
      fontSize: 10,
      fontFamily: font.sansMedium,
      color: colors.stardustDim,
      backgroundColor: colors.surfaceHigh,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    stats: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    star: { fontSize: 12 },
    ratingText: { fontSize: 13, fontFamily: font.sansBold, color: colors.gold },
    ratingCount: { fontSize: 11, color: colors.muted, fontFamily: font.sans },
    priceContainer: { alignItems: 'flex-end', gap: 2 },
    price: { fontSize: 18, fontFamily: font.sansBold, color: colors.amethystLight },
    duration: { fontSize: 11, color: colors.muted, fontFamily: font.sans },
  });
}

interface Props {
  consultant: Consultant;
  onPress: () => void;
}

export function ConsultantCard({ consultant, onPress }: Props) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const styles = useMemo(() => buildScreenStyles(theme), [theme]);
  const isOnline = typeof consultant.is_online === 'boolean'
    ? consultant.is_online
    : Number(consultant.is_online ?? consultant.is_available) === 1;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.avatarContainer}>
          {consultant.avatar_url ? (
            <Image source={{ uri: consultant.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {consultant.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
              </Text>
            </View>
          )}
          {consultant.approval_status === 'approved' && (
            <View style={styles.badge}>
              <Text style={styles.badgeIcon}>✓</Text>
            </View>
          )}
          {isOnline && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {consultant.full_name}
          </Text>

          <View style={styles.expertiseRow}>
            {consultant.expertise?.slice(0, 2).map((exp, i) => (
              <Text key={i} style={styles.expertiseTag}>
                {t(`home.expertise.${exp}`, exp)}
              </Text>
            ))}
            {consultant.expertise && consultant.expertise.length > 2 && (
              <Text style={styles.expertiseTag}>+{consultant.expertise.length - 2}</Text>
            )}
          </View>

          <View style={styles.stats}>
            <View style={styles.rating}>
              <Text style={styles.star}>⭐</Text>
              <Text style={styles.ratingText}>{consultant.rating_avg}</Text>
              <Text style={styles.ratingCount}>({consultant.rating_count})</Text>
            </View>
          </View>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>₺{Math.round(Number(consultant.session_price))}</Text>
          <Text style={styles.duration}>{consultant.session_duration} dk</Text>
        </View>
      </View>
    </Pressable>
  );
}
